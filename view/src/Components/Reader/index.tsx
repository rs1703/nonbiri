import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useRouteMatch } from "react-router";
import AppContext from "../../AppContext";
import { Task } from "../../constants";
import "../../styles/Reader.less";
import utils from "../../utils";
import { deepClone, formatChapter } from "../../utils/encoding";
import { useMounted, useMutableHistory, useMutableLocation, useMutableMemo } from "../../utils/hooks";
import Sync from "../../utils/Sync";
import websocket, { GetChapters, GetManga, ReadChapter, ReadPage, UpdateChapters, UpdateManga } from "../../websocket";
import NotFound from "../NotFound";
import Spinner from "../Spinner";
import Main from "./Main";
import ReaderContext from "./ReaderContext";
import Sidebar from "./Sidebar";

const findByGroups = (current: Chapter, target: Chapter, chapters: Chapter[]): Chapter => {
  if (!current || !target || !chapters?.length) {
    return undefined;
  }

  const filteredChapters = chapters.filter(chapter => chapter.chapter === target.chapter);
  const result = filteredChapters.find(chapter => {
    if (chapter.groups?.length === current.groups?.length) {
      return current.groups?.every(a => chapter.groups?.some(b => a.id === b.id));
    }
    return current.groups?.some(a => chapter.groups?.some(b => a.id === b.id));
  });

  return result || target;
};

/**
 * Fix/optimize: data/state management
 * right now they're copy pasted from components/manga
 */
const Reader = () => {
  const { mangaId, chapterId } = useRouteMatch<RouteContext>("*/:mangaId/:chapterId").params;
  const historyRef = useMutableHistory<LocationContext>();
  const stateRef = useMutableLocation<LocationContext>();

  const { library } = useContext(AppContext).context;

  const dataRef = useMutableMemo<Manga>(
    () => library?.find(m => m.id === mangaId) || stateRef.current?.data,
    [library, stateRef.current?.data]
  );

  const idxRef = useRef(0);
  const chapterRef = useMutableMemo<Chapter>(
    prevState => {
      if (!dataRef.current?.chapters?.length) {
        return undefined;
      }

      idxRef.current = dataRef.current.chapters.findIndex(c => c.id === chapterId);
      const chapter = dataRef.current.chapters[idxRef.current];
      if (chapter && chapter?.id === prevState?.id) {
        prevState.history = chapter.history;
        return prevState;
      }

      return chapter;
    },
    [dataRef.current?.chapters]
  );
  const [prevChapter, nextChapter] = useMemo<Chapter[]>(() => {
    if (!chapterRef.current) {
      return [];
    }

    let prev: Chapter;
    for (let i = idxRef.current + 1; i < dataRef.current.chapters.length; i++) {
      const c = dataRef.current.chapters[i];
      if (c.chapter !== chapterRef.current.chapter) {
        prev = findByGroups(chapterRef.current, c, dataRef.current.chapters);
        break;
      }
    }

    let next: Chapter;
    for (let i = idxRef.current - 1; i >= 0; i--) {
      const c = dataRef.current.chapters[i];
      if (c.chapter !== chapterRef.current.chapter) {
        next = findByGroups(chapterRef.current, c, dataRef.current.chapters);
        break;
      }
    }

    return [prev, next];
  }, [chapterRef.current]);

  const [pages, setPages] = useState<PageState[]>([]);
  const currentPage = useMemo(() => pages?.find(page => page.isViewing) || pages?.[0], [pages]);

  const isTransitionRef = useRef<boolean>();
  const mountedRef = useMounted();

  const [isLoading, setIsLoading] = useState<boolean>(!dataRef.current || !chapterRef.current?.pages?.length || !pages);
  const [isUpdating, setIsUpdating] = useState<boolean>();

  useEffect(() => {
    const updateData = ({ body }: IncomingMessage<Manga>) => {
      if (!body || body.id !== mangaId) {
        return;
      }

      console.info("[Manga] Synchronizing data...");
      Object.assign((dataRef.current ??= {} as Manga), body);
      historyRef.current.replace({
        state: {
          ...stateRef.current,
          data: { ...dataRef.current }
        }
      });
    };

    const updateChapter = ({ body }: IncomingMessage<Chapter>) => {
      if (!body || body.mangaId !== mangaId) {
        return;
      }

      console.info("[Manga] Synchronizing chapter...");
      const chapters = (dataRef.current.chapters ??= []);

      const chapter = chapters.find(c => c.id === body.id);
      if (chapter) {
        Object.assign(chapter, body);
      } else {
        chapters.push(body);
      }

      historyRef.current.replace({
        state: {
          ...stateRef.current,
          data: { ...dataRef.current }
        }
      });
    };

    const updateChapters = ({ body }: IncomingMessage<Chapter[]>) => {
      if (!body?.length || body[0].mangaId !== mangaId) {
        return;
      }

      console.info("[Manga] Synchronizing chapters...");
      const chapters = (dataRef.current.chapters ??= []);

      for (let i = 0; i < body.length; i++) {
        const chapter = chapters.find(c => c.id === body[i].id);
        if (chapter) {
          Object.assign(chapter, body[i]);
        } else {
          chapters.push(body[i]);
        }
      }

      historyRef.current.replace({
        state: {
          ...stateRef.current,
          data: { ...dataRef.current }
        }
      });
    };

    const updateHistory = ({ body }: IncomingMessage<ReadState>) => {
      if (!body || body.mangaId !== mangaId) {
        return;
      }

      console.info("[Manga] Synchronizing history...");
      const chapters = (dataRef.current.chapters ??= []);
      dataRef.current.chapters = Sync.History(deepClone(chapters), body);

      historyRef.current.replace({
        state: {
          ...stateRef.current,
          data: { ...dataRef.current }
        }
      });
    };

    const updateHistories = ({ body }: IncomingMessage<ReadState[]>) => {
      if (!body?.length || body[0].mangaId !== mangaId) {
        return;
      }

      console.info("[Manga] Synchronizing histories...");
      const chapters = (dataRef.current.chapters ??= []);

      if (chapters.length) {
        const clone = deepClone(chapters);
        for (let i = 0; i < body.length; i++) {
          dataRef.current.chapters = Sync.History(clone, body[i]);
        }
      }

      historyRef.current.replace({
        state: { ...stateRef.current, data: { ...dataRef.current } }
      });
    };

    const removeHandlers = [
      websocket.Handle(Task.GetManga, updateData),
      websocket.Handle(Task.UpdateManga, updateData),
      websocket.Handle(Task.FollowManga, updateData),
      websocket.Handle(Task.UnfollowManga, updateData),

      websocket.Handle(Task.GetChapter, updateChapter),
      websocket.Handle(Task.UpdateChapter, updateChapter),
      websocket.Handle(Task.GetChapters, updateChapters),
      websocket.Handle(Task.UpdateChapters, updateChapters),

      websocket.Handle(Task.ReadPage, updateHistory),
      websocket.Handle(Task.ReadChapter, updateHistories),
      websocket.Handle(Task.UnreadChapter, updateHistories)
    ];

    (async () => {
      if (!dataRef.current) {
        const track = utils.Track("[Reader] Getting metadata...");
        const { error } = await GetManga(mangaId);
        track();

        if (!mountedRef.current) return;
        if (!error) setIsLoading(false);
      } else if (!dataRef.current.chapters) {
        const track = utils.Track("[Reader] Getting chapters...");
        const { error } = await GetChapters(mangaId);
        track();

        if (!mountedRef.current) return;
        if (!error) setIsLoading(false);
      } else if (chapterRef.current?.pages?.length) {
        setIsLoading(false);
        return;
      }

      if (chapterRef.current?.externalURL) return;
      setIsUpdating(true);

      const track = utils.Track("[Reader] Retrieving latest metadata and chapters...");
      let error: string;

      if (!dataRef.current) {
        ({ error } = await UpdateManga(mangaId));
      } else {
        ({ error } = await UpdateChapters(mangaId));
      }

      track();

      if (!mountedRef.current) return;
      if (error) console.error(error);

      setIsLoading(false);
      setIsUpdating(false);
    })();

    return () => {
      removeHandlers.forEach(remove => remove());
    };
  }, []);

  // Set/reset PageStates when chapteId or pages have been changed
  useEffect(() => {
    if (!chapterRef.current || chapterRef.current?.externalURL) return;

    const newPages: PageState[] = (chapterRef.current?.pages || []).map((_, i) => ({ num: i + 1 }));
    if (newPages.length) {
      let lastViewed = Number(chapterRef.current?.history?.lastViewed);
      if (!lastViewed || lastViewed === newPages.length) {
        lastViewed = 1;
      }
      newPages[lastViewed - 1].isViewing = true;
    }

    setPages(newPages);
  }, [chapterRef.current?.pages]);

  /**
   * Update history.lastViewed to the current page number.
   * When viewing the last page, mark the chapter as readed.
   */
  const timeoutRef = useRef(0);
  useEffect(() => {
    /**
     * Abort when history.lastViewed is the same as current
     * page number or when the page is transitioning (toggling sidebar).
     */
    if (!currentPage?.ref || chapterRef.current.history?.lastViewed === currentPage?.num) {
      return;
    }

    clearTimeout(timeoutRef.current);

    /**
     * Use timeout so that we don't update the history when
     * the user is scrolling too fast.
     */
    timeoutRef.current = window.setTimeout(() => {
      console.info("[Reader] Viewing page %d", currentPage.num);
      if (currentPage.num === chapterRef.current.pages.length) {
        if (chapterRef.current.history?.readed) {
          ReadPage(chapterRef.current.id, 0);
        } else {
          ReadChapter(chapterRef.current.id);
        }
      } else {
        ReadPage(chapterRef.current.id, currentPage.num);
      }
    }, 250);
  }, [currentPage]);

  return (
    <ReaderContext.Provider
      value={useMemo(
        () => ({
          isLoading,
          isUpdating,

          isTransitionRef,
          mountedRef,
          dataRef,

          chapterRef,
          prevChapter,
          nextChapter,

          pages,
          currentPage,

          setIsLoading,
          setIsUpdating,
          setPages
        }),
        [chapterRef.current, currentPage, isLoading, isUpdating, nextChapter, pages, prevChapter]
      )}
    >
      {dataRef.current && chapterRef.current && (
        <Helmet>
          <title>
            {formatChapter(chapterRef.current, false)} - {dataRef.current.title} - Nonbiri
          </title>
        </Helmet>
      )}

      {dataRef.current ? (
        <>
          <Sidebar />
          <Main key={chapterId} />
        </>
      ) : (
        (() =>
          isLoading ? (
            <Spinner styleName="loading" />
          ) : (
            <NotFound>
              <p>Manga does not exists</p>
            </NotFound>
          ))()
      )}
    </ReaderContext.Provider>
  );
};

export default Reader;
