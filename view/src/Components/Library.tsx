import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { IoMdRefresh } from "react-icons/io";
import AppContext from "../AppContext";
import Config from "../Config";
import { Order, Sort, Task } from "../constants";
import "../styles/Entry.less";
import utils from "../utils";
import { formatQuery, parseQuery } from "../utils/encoding";
import { useMounted, useMutableHistory } from "../utils/hooks";
import { isQueryEmpty } from "../utils/validator";
import websocket, { GetUpdateLibraryState, UpdateLibrary, UpdateLibraryPreference } from "../websocket";
import Anchor from "./Anchor";
import Entry from "./Entry";
import Header from "./Header";
import NotFound from "./NotFound";

const sortOptions: SortOptions = [
  ["Title", Sort.Title],
  ["Total Chapters", Sort.Chapters],
  ["Unreaded", Sort.UnreadedChapters],
  ["Latest Chapter", Sort.LatestUploadedChapter]
];

/**
 * Data search function
 *
 * Search query will also match artists/authors name and title.
 *
 * includedTag is using AND operator (`query.includedTag.every`),
 * it will only show manga that contains all specified tags in includedTag.
 * - Change it to `.some` to show manga that contains one of specified tags.
 *
 * excludedTag is using OR operator (`query.excludedTag.some`),
 * it will excludes manga that contains one of specified tags in excludedTag.
 * - Change it to `.every` to hide manga that contains all specified tags.
 */
const searchData = (data: Manga[], { search, ...query }: BrowseQuery) => {
  if (!data) return [];
  return Array.from(data).filter(m => {
    const entities = [...(m.artists || []), ...(m.authors || [])];
    return !(
      (search && !(entities.some(e => utils.Contains(e?.name, search)) || utils.Contains(m.title, search))) ||
      (query.demographic?.length && !query.demographic.includes(m.demographic)) ||
      (query.origin?.length && !query.origin.includes(m.origin)) ||
      query.excludedOrigin?.includes(m.origin) ||
      (query.rating?.length && !query.rating.includes(m.rating)) ||
      (query.status?.length && !query.status.includes(m.status)) ||
      (query.includedTag?.length && !query.includedTag.every(a => m.tags?.some(b => utils.Contains(b, a)))) ||
      query.excludedTag?.some(a => m.tags?.some(b => utils.Contains(b, a)))
    );
  });
};

const sortData = (data: Manga[], sort: Sort, order: Order) => {
  if (!data?.length) {
    return [];
  }
  return Array.from(data).sort((prev, next) => {
    switch (sort) {
      case Sort.Title:
        return order === Order.ASC ? prev.title.localeCompare(next.title) : next.title.localeCompare(prev.title);

      case Sort.Chapters: {
        const pTotal = prev.totalChapters;
        const nTotal = next.totalChapters;

        if (pTotal === nTotal) {
          return prev.title.localeCompare(next.title);
        }
        return order === Order.ASC ? pTotal - nTotal : nTotal - pTotal;
      }

      case Sort.UnreadedChapters: {
        const pUnreaded = prev.totalChapters - prev.readedChapters;
        const nUnreaded = next.totalChapters - next.readedChapters;

        if (pUnreaded === nUnreaded) {
          return prev.title.localeCompare(next.title);
        }
        return order === Order.ASC ? pUnreaded - nUnreaded : nUnreaded - pUnreaded;
      }

      case Sort.LatestUploadedChapter:
      default: {
        const pLatest = prev.latestChapterAt || 0;
        const nLatest = next.latestChapterAt || 0;

        if (pLatest === nLatest) {
          return prev.title.localeCompare(next.title);
        }
        return order === Order.ASC ? pLatest - nLatest : nLatest - pLatest;
      }
    }
  });
};

export const LibraryContext = createContext<LibraryContext>(undefined);

const Library = () => {
  const historyRef = useMutableHistory();
  const { context } = useContext(AppContext);
  const { sort, order } = context.prefs.library;

  const mountedRef = useMounted();
  const ref = useRef<HTMLDivElement>();

  const [isUpdating, setIsUpdating] = useState<boolean>();
  const [updateState, setUpdateState] = useState<LibraryUpdateState>();

  const [query, setQuery] = useState<BrowseQuery>(() =>
    historyRef.current.location.search ? parseQuery(historyRef.current.location.search) : {}
  );
  const [page, setPage] = useState<number>(1);

  const data = useMemo(() => {
    const v = isQueryEmpty(query) ? context.library : searchData(context.library, query);
    return sortData(v, sort, order);
  }, [context.library, order, query, sort]);

  const updateSortState = useCallback(
    async (v: Sort) => {
      const pref = { ...context.prefs.library };
      if (pref.sort === v) {
        pref.order = pref.order === Order.ASC ? Order.DESC : Order.ASC;
      } else {
        pref.order = Order.DESC;
      }
      pref.sort = v;

      const { error } = await UpdateLibraryPreference(pref);
      if (error) console.error(error);
    },
    [context.prefs.library]
  );

  const updateLibrary = useCallback(async () => {
    if (isUpdating) return;
    UpdateLibrary();
  }, [isUpdating]);

  useEffect(() => {
    const pushUpdateState = ({ body }: IncomingMessage<LibraryUpdateState>) => {
      setUpdateState(body);
      setIsUpdating(!!body);
    };

    const removers = [
      websocket.Handle(Task.UpdateLibrary, pushUpdateState),
      websocket.Handle(Task.GetUpdateLibraryState, pushUpdateState)
    ];

    GetUpdateLibraryState();

    return () => {
      removers.forEach(remove => remove());
    };
  }, []);

  /**
   * Update URLSearchParams when BrowseQuery has been changed.
   * Usually fires when searching or sorting.
   */
  useEffect(() => {
    const q = formatQuery(query);
    if (q !== decodeURIComponent(historyRef.current.location.search)) {
      console.info("[Library] Updating searchParams...");
      historyRef.current.push({ search: q ? encodeURI(q) : "" });
    }
  }, [query]);

  /**
   * Update BrowseQuery when URLSearchParams has been changed.
   * At the same time, reset page to 1.
   *
   * Usually fires when user is navigating using the browser's
   * back and forward button.
   */
  useEffect(() => {
    if (formatQuery(query) !== decodeURIComponent(historyRef.current.location.search)) {
      console.info("[Library] Updating query...");
      setQuery(parseQuery(historyRef.current.location.search));
      setPage(1);
    }
  }, [historyRef.current.location.search]);

  /**
   * Attach IntersectionObserver to the last entry.
   * Paginate when the element is within the viewport,
   * and re-attach IntersectionObserver to the new last entry.
   */
  useEffect(() => {
    if (!ref.current || page * Config.library.limit > data?.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(oEntries => {
      oEntries.forEach(oEntry => {
        if (!mountedRef.current || !oEntry.isIntersecting) {
          return;
        }
        console.info("[Library] Paginating...");
        observer.disconnect();
        setPage(x => x + 1);
      });
    });

    const idx = Math.floor(ref.current.childElementCount - Config.library.limit / 2);
    if (idx > 0) observer.observe(ref.current.children[idx]);

    return () => {
      observer.disconnect();
    };
  }, [data, page]);

  return (
    <LibraryContext.Provider value={useMemo(() => ({ mountedRef, data, query, setQuery }), [data, query])}>
      <Helmet>
        <title>Library ({(context.library || []).length.toString()}) - Nonbiri</title>
      </Helmet>

      <Header
        searchProps={{ query, setQuery }}
        sorterProps={{ options: sortOptions, sort, order, callback: updateSortState }}
      >
        <button
          styleName="update"
          data-active={isUpdating || undefined}
          type="button"
          title="Check for updates"
          onClick={updateLibrary}
        >
          <IoMdRefresh />
        </button>
      </Header>
      <div styleName="library">
        {data?.length ? (
          <>
            {updateState && updateState.current && (
              <div styleName="updateState">
                <strong>
                  Updating ({updateState.progress}/{updateState.total}): {updateState.current}
                </strong>
                <div style={{ width: `calc(${updateState.progress}/${updateState.total} * 100%)` }} />
              </div>
            )}
            <div styleName="libraryContent" ref={ref}>
              {data.slice(0, Config.library.limit * page).map(v => (
                <Entry manga={v} key={v.id} />
              ))}
            </div>
          </>
        ) : (
          (() =>
            query && context.library?.length ? (
              <NotFound title="No results were found" styleName="notFound">
                <p>
                  There are no results that match your search query
                  <br />
                  Try another search query or search on{" "}
                  <Anchor to="/browse">
                    <strong>Browse</strong>
                  </Anchor>
                </p>
              </NotFound>
            ) : (
              <NotFound title="Your library is empty" styleName="notFound">
                <p>
                  You have no followed manga
                  <br />
                  Start{" "}
                  <Anchor to="/browse">
                    <strong>browsing</strong>
                  </Anchor>{" "}
                  or import your MangaDex follows
                </p>
              </NotFound>
            ))()
        )}
      </div>
    </LibraryContext.Provider>
  );
};

export default Library;
