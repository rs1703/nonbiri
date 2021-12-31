import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import AppContext from "../AppContext";
import Config from "../Config";
import { Order, Sort, Task } from "../constants";
import "../styles/Entry.less";
import utils from "../utils";
import { deepClone, formatQuery, parseQuery } from "../utils/encoding";
import { useMounted, useMutableHistory } from "../utils/hooks";
import Sync from "../utils/Sync";
import websocket, { GetBrowse } from "../websocket";
import Entry from "./Entry";
import Header from "./Header";
import NotFound from "./NotFound";
import Spinner from "./Spinner";

const sortOptions: SortOptions = [
  ["Title", Sort.Title],
  ["Created At", Sort.CreatedAt],
  ["Updated At", Sort.UpdatedAt],
  ["Latest Chapter", Sort.LatestUploadedChapter],
  ["Number of Follows", Sort.FollowedCount],
  ["Relevance", Sort.Relevance]
];

export const BrowseContext = createContext<BrowseContext>(undefined);

const Browse = () => {
  const historyRef = useMutableHistory();
  const { prefs } = useContext(AppContext).context;

  const ref = useRef<HTMLDivElement>();
  const mountedRef = useMounted();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState<boolean>();

  const [data, setData] = useState<BrowseData>({
    entries: [],
    query: {
      excludedTag: prefs.browse.excludedTags,
      availableLanguage: [prefs.browse.language],
      origin: prefs.browse.origins,
      rating: prefs.browse.ratings,
      sort: Sort.LatestUploadedChapter,
      order: Order.DESC
    }
  });
  const [query, setQuery] = useState<BrowseQuery>(() =>
    historyRef.current.location.search ? parseQuery(historyRef.current.location.search) : data.query
  );
  const { sort, order } = query || data.query;

  const updateSortState = useCallback(
    (v: Sort) => {
      if (isLoading) return;
      setQuery(prevState => {
        const q: BrowseQuery = { ...(prevState || data.query), offset: undefined };

        if (q.sort === v) {
          q.order = q.order === Order.ASC ? Order.DESC : Order.ASC;
        } else {
          q.order = Order.DESC;
        }

        q.sort = v;
        return q;
      });
    },
    [data.query, isLoading, setQuery]
  );

  useEffect(() => {
    const updateData = ({ body }: IncomingMessage<Manga>) => {
      if (!body) return;
      console.info("[Browse] Synchronizing data...");
      setData(prevState => {
        const entries = Array.from(prevState.entries ?? []);

        const entry = entries.find(m => m.id === body.id);
        if (entry) {
          Object.assign(entry, body);
        }

        return { ...prevState, entries };
      });
    };

    const updateChapters = ({ body }: IncomingMessage<Chapter[]>) => {
      if (!body) return;
      console.info("[Browse] Synchronizing chapters...");
      setData(prevState => {
        const entries = Array.from(prevState.entries ?? []);

        const entry = entries.find(m => m.id === body[0].mangaId);
        for (let i = 0; i < body.length; i++) {
          const chapter = entry.chapters?.find(c => c.id === body[i].id);
          if (chapter) {
            Object.assign(chapter, body[i]);
          } else {
            if (!Array.isArray(entry.chapters)) {
              entry.chapters = [];
            }
            entry.chapters.push(body[i]);
          }
        }

        return { ...prevState, entries };
      });
    };

    const updateHistories = ({ body }: IncomingMessage<ReadState[]>) => {
      if (!body) return;
      console.info("[Browse] Synchronizing histories...");
      setData(prevState => {
        const entries = Array.from(prevState.entries ?? []);

        const entry = entries.find(m => m.id === body[0].mangaId);
        if (entry?.chapters?.length) {
          const chapters = deepClone(entry.chapters);
          for (let i = 0; i < body.length; i++) {
            entry.chapters = Sync.History(chapters, body[i]);
          }
        }

        return { ...prevState, entries };
      });
    };

    const removeHandlers = [
      websocket.Handle(Task.Browse, ({ body }: IncomingMessage<BrowseData>) => {
        setData(prevState => {
          const entries = Sync.All(body?.offset > 0 ? prevState?.entries : [], body?.entries);
          return { ...body, entries };
        });
      }),

      websocket.Handle(Task.GetManga, updateData),
      websocket.Handle(Task.UpdateManga, updateData),
      websocket.Handle(Task.FollowManga, updateData),
      websocket.Handle(Task.UnfollowManga, updateData),

      websocket.Handle(Task.GetChapters, updateChapters),
      websocket.Handle(Task.UpdateChapters, updateChapters),

      websocket.Handle(Task.ReadPage, ({ body }: IncomingMessage<ReadState>) => {
        if (!body) return;
        console.info("[Browse] Synchronizing history...");
        setData(prevState => {
          const entries = Array.from(prevState.entries ?? []);

          const entry = entries.find(m => m.id === body.mangaId);
          if (entry?.chapters?.length) {
            entry.chapters = Sync.History(deepClone(entry.chapters), body);
          }

          return { ...prevState, entries };
        });
      }),

      websocket.Handle(Task.ReadChapter, updateHistories),
      websocket.Handle(Task.UnreadChapter, updateHistories)
    ];

    return () => {
      removeHandlers.forEach(remove => remove());
    };
  }, []);

  /**
   * Update URLSearchParams when BrowseQuery has been changed.
   * At the same time, send BrowserQuery to the back-end.
   * Usually fires when searching or sorting.
   */
  useEffect(() => {
    const q = formatQuery(query);
    if (q !== decodeURIComponent(historyRef.current.location.search)) {
      console.info("[Browse] Updating searchParams...");
      historyRef.current.push({ search: q ? encodeURI(q) : "" });
    }

    (async () => {
      setIsLoading(true);

      const track = utils.Track("[Browse] Querying...");
      const { error } = await GetBrowse(query);
      track();

      if (!mountedRef.current) return;
      if (error) console.error(error);

      setIsLoading(false);
    })();
  }, [query]);

  /**
   * Update BrowseQuery when URLSearchParams has been changed.
   *
   * Usually fires when user is navigating using the browser's
   * back and forward button.
   */
  useEffect(() => {
    if (formatQuery(query) !== decodeURIComponent(historyRef.current.location.search)) {
      console.info("[Browse] Updating query...");
      setQuery(parseQuery(historyRef.current.location.search));
    }
  }, [historyRef.current.location.search]);

  /**
   * Attach IntersectionObserver to the last entry.
   * Paginate when the element is within the viewport,
   * and re-attach IntersectionObserver to the new last entry.
   */
  useEffect(() => {
    if (!ref.current || isLoading || data?.offset > data?.total) {
      return undefined;
    }

    const observer = new IntersectionObserver(oEntries => {
      oEntries.forEach(async oEntry => {
        if (!mountedRef.current || !oEntry.isIntersecting) {
          return;
        }
        observer.disconnect();
        setIsPaginating(true);

        const track = utils.Track("[Browse] Paginating...");
        const { error } = await GetBrowse({ ...query, offset: data.offset + data.limit });
        track();

        if (!mountedRef.current) return;
        if (error) console.error(error);

        setIsPaginating(false);
      });
    });

    const idx = Math.floor(ref.current.childElementCount - Config.browse.limit / 2);
    if (idx > 0) observer.observe(ref.current.children[idx]);

    return () => {
      observer.disconnect();
    };
  }, [data?.limit, data?.offset, data?.total, isLoading, query]);

  return (
    <BrowseContext.Provider
      value={useMemo(
        () => ({
          mountedRef,
          isLoading,
          data,
          query,
          setIsLoading,
          setData,
          setQuery
        }),
        [data, isLoading, query]
      )}
    >
      <Helmet>
        <title>Browse - Nonbiri</title>
      </Helmet>

      <Header
        searchProps={{ query, setQuery, isBrowse: true }}
        sorterProps={{ options: sortOptions, sort, order, callback: updateSortState }}
      />
      <div styleName="browse">
        {isLoading ? (
          <Spinner styleName="loading" />
        ) : (
          (() =>
            data?.entries?.length ? (
              <div styleName="browseContent" ref={ref}>
                {data.entries.map(entry => (
                  <Entry manga={entry} isBrowse key={entry.id} />
                ))}
                {isPaginating && <Spinner styleName="paginating" />}
              </div>
            ) : (
              <NotFound title="No results were found">
                <p>There are no results that match your search query</p>
              </NotFound>
            ))()
        )}
      </div>
    </BrowseContext.Provider>
  );
};

export default Browse;
