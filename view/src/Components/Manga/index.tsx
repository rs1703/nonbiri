import marked from "marked";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useRouteMatch } from "react-router";
import AppContext from "../../AppContext";
import { routes } from "../../Config";
import { Task } from "../../constants";
import "../../styles/Manga.less";
import utils from "../../utils";
import { deepClone, formatCoverURL } from "../../utils/encoding";
import { useMounted, useMutableHistory, useMutableLocation, useMutableMemo } from "../../utils/hooks";
import Sync from "../../utils/Sync";
import websocket, { GetChapters, GetManga, UpdateManga } from "../../websocket";
import Anchor from "../Anchor";
import Chapters from "../Chapters";
import Expandable from "../Expandable";
import Header from "../Header";
import NotFound from "../NotFound";
import Picture from "../Picture";
import Spinner from "../Spinner";
import MangaContext from "./MangaContext";
import Sidebar from "./Sidebar";

/**
 * Fix: data/state management
 */
const Manga = () => {
  const { mangaId } = useRouteMatch<{ mangaId: string }>("*/:mangaId").params;
  const historyRef = useMutableHistory<LocationContext>();
  const stateRef = useMutableLocation<LocationContext>();

  const { library } = useContext(AppContext).context;

  const ref = useRef<HTMLDivElement>();
  const mountedRef = useMounted();
  const dataRef = useMutableMemo<Manga>(
    () => library?.find(m => m.id === mangaId) || stateRef.current?.data,
    [library, stateRef.current?.data]
  );

  const [isLoading, setIsLoading] = useState<boolean>(!dataRef.current?.chapters?.length);
  const [isUpdating, setIsUpdating] = useState<boolean>();

  const cover = useMemo(() => formatCoverURL(dataRef.current), [dataRef.current?.cover]);
  const description = useMemo(
    () => (dataRef.current?.description ? marked(dataRef.current.description) : undefined),
    [dataRef.current?.description]
  );

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
        const track = utils.Track("[Manga] Getting metadata...");
        const { error } = await GetManga(mangaId);
        track();

        if (!mountedRef.current) return;
        if (!error) setIsLoading(false);
      } else if (!dataRef.current.chapters) {
        const track = utils.Track("[Manga] Getting chapters...");
        const { error } = await GetChapters(mangaId);
        track();

        if (!mountedRef.current) return;
        if (!error) setIsLoading(false);
      }

      setIsUpdating(true);

      const track = utils.Track("[Manga] Retrieving latest metadata and chapters...");
      const { error } = await UpdateManga(mangaId);
      track();

      if (!mountedRef.current) return;
      if (error) console.error(error);

      setIsUpdating(false);
      setIsLoading(false);
    })();

    return () => {
      removeHandlers.forEach(remove => remove());
    };
  }, []);

  return (
    <MangaContext.Provider
      value={useMemo(
        () => ({ mountedRef, isLoading, isUpdating, dataRef, setIsLoading, setIsUpdating }),
        [isLoading, isUpdating]
      )}
    >
      {dataRef.current?.title && (
        <Helmet>
          <title>{dataRef.current.title} - Nonbiri</title>
        </Helmet>
      )}

      <Header />

      <div styleName="manga" ref={ref}>
        {isLoading && !dataRef.current && <Spinner styleName="loading" />}
        <If condition={!isLoading || (isLoading && !!dataRef.current)}>
          {!dataRef.current && (
            <NotFound styleName="notFound">
              <p>Manga does not exists</p>
            </NotFound>
          )}
          <If condition={!!dataRef.current}>
            <div styleName="banner">
              {(dataRef.current.banner?.length || 0) > 1 ? (
                <Picture styleName="img" src={dataRef.current.banner} div />
              ) : (
                <If condition={!isLoading || !!dataRef.current.banner}>
                  <Picture styleName="img" src={cover} div />
                  <div styleName="blur" />
                </If>
              )}
              <div styleName="shadow" />
            </div>

            <div styleName="content">
              <Sidebar />
              <div styleName="main">
                <h1 styleName="title">{dataRef.current.title}</h1>
                <Expandable maxHeight={120}>
                  {description ? (
                    <div styleName="description" dangerouslySetInnerHTML={{ __html: description }} />
                  ) : (
                    <div styleName="description">
                      <p>No description</p>
                    </div>
                  )}
                </Expandable>

                {dataRef.current.relateds?.length && (
                  <div styleName="relateds">
                    <h2>Related Manga</h2>
                    <Expandable maxHeight={120}>
                      <ul>
                        {dataRef.current.relateds.map(related => (
                          <li key={related.id}>
                            <Anchor to={`${routes.manga}/${related.id}`}>{related.title}</Anchor>
                          </li>
                        ))}
                      </ul>
                    </Expandable>
                  </div>
                )}
                <Chapters context={MangaContext} />
              </div>
            </div>
          </If>
        </If>
      </div>
    </MangaContext.Provider>
  );
};

export default Manga;
