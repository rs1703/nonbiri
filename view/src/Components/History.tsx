import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { BiHide, BiShow } from "react-icons/bi";
import Config, { routes } from "../Config";
import { Task } from "../constants";
import styles from "../styles/History.less";
import utils from "../utils";
import { formatDate, formatThumbnailURL } from "../utils/encoding";
import { useIntersectionObserver, useMounted } from "../utils/hooks";
import websocket, { GetHistory, ReadChapter, UnreadChapter } from "../websocket";
import Anchor from "./Anchor";
import Header from "./Header";
import NotFound from "./NotFound";
import Picture from "./Picture";
import Spinner from "./Spinner";
import UpdateProgress from "./UpdateProgress";

interface HistoryEntry {
  id: string;
  title: string;
  cover: string;
  histories: ReadState[];
}

type HistoryEntries = { [key: string]: HistoryEntry };

const formatHistory = (history: ReadState) => {
  if (history.chapterTitle === "Oneshot") {
    return history.chapterTitle;
  }

  const arr: string[] = [];

  if (history.volume) arr.push(`Vol. ${history.volume}`);
  if (history.chapter) arr.push(`Ch. ${history.chapter}`);
  if (history.chapterTitle) arr.push(`- ${history.chapterTitle}`);

  return arr.join(" ") || "Ch. 0";
};

const makeEntries = (histories: ReadState[]) =>
  (histories || []).reduce<HistoryEntries>((entries, history) => {
    const { mangaId: id, cover, mangaTitle: title, chapterTitle, ...h } = history;
    const entry = (entries[id] ??= { id, cover, title, histories: [] });
    entry.histories.push(h as ReadState);
    return entries;
  }, {});

const Item = ({ mangaId, data }: { mangaId: string; data: ReadState }) => {
  const mountedRef = useMounted();
  const mutex = useRef<boolean>();

  const [isVisible, setIsVisible] = useState<boolean>();
  const ref = useIntersectionObserver<HTMLLIElement>(
    () => {
      if (!mountedRef.current) return;
      setIsVisible(true);
    },
    { once: true }
  );

  const isUnreaded = !data.readed && !data.lastViewed;
  const updateReadState = useCallback(async () => {
    if (mutex.current) return;
    mutex.current = true;

    let error: string;
    if (isUnreaded) {
      ({ error } = await ReadChapter(data.chapterId));
    } else {
      ({ error } = await UnreadChapter(data.chapterId));
    }

    if (!mountedRef.current) return;
    if (error) console.error(error);
    mutex.current = false;
  }, [isUnreaded]);

  useEffect(() => {
    if (ref.current && mountedRef.current && isVisible) {
      ref.current.classList.remove(styles.hidden);
    }
  }, [isVisible]);

  return (
    <li styleName="hidden" data-deleted={isUnreaded || undefined} ref={ref}>
      {isVisible && (
        <>
          <Anchor to={`${routes.reader}/${mangaId}/${data.chapterId}`}>
            <h3>{formatHistory(data)}</h3>
            <span styleName="info">
              {formatDate(data.updatedAt || data.createdAt)}
              {!isUnreaded && (
                <>
                  {!!data.lastViewed && ` • ${data.readed ? "Re-reading" : "Reading"}`}
                  {` • ${data.lastViewed ? `Page ${data.lastViewed}` : "Finished"}`}
                </>
              )}
            </span>
          </Anchor>
          <button type="button" title={isUnreaded ? "Mark as readed" : "Mark as unreaded"} onClick={updateReadState}>
            {isUnreaded ? <BiShow /> : <BiHide />}
          </button>
        </>
      )}
    </li>
  );
};

const MemoizedItem = memo(
  Item,
  (prev, next) =>
    prev.data?.readed === next.data?.readed &&
    prev.data?.lastViewed === next.data?.lastViewed &&
    prev.data?.updatedAt === next.data?.updatedAt
);

const Entry = ({ data }: { data: HistoryEntry }) => {
  const mountedRef = useMounted();

  const [isVisible, setIsVisible] = useState<boolean>();
  const ref = useIntersectionObserver<HTMLDivElement>(
    ({ isIntersecting }) => {
      if (!isIntersecting) return;
      setIsVisible(true);
    },
    { once: true }
  );

  useEffect(() => {
    if (ref.current && mountedRef.current && isVisible) {
      ref.current.classList.remove(styles.hidden);
    }
  }, [isVisible]);

  return (
    <div styleName="group hidden" ref={ref}>
      <div styleName="figure">
        <div styleName="cover">
          {isVisible && (
            <Anchor to={`${routes.manga}/${data.id}`}>
              <Picture src={formatThumbnailURL(data)} div />
            </Anchor>
          )}
        </div>
      </div>
      <div styleName="content">
        <h2>
          <Anchor to={`${routes.manga}/${data.id}`}>{data.title}</Anchor>
        </h2>
        <ul styleName="list">
          {Object.values(data.histories).map(it => (
            <MemoizedItem mangaId={data.id} data={it} key={it.id} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const History = () => {
  const mountedRef = useMounted();
  const ref = useRef<HTMLDivElement>();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<HistoryEntries>({});
  const feed = useMemo(() => Object.values(data).slice(0, Config.history.limit * currentPage), [currentPage, data]);

  useEffect(() => {
    const updateEntries = ({ body }: IncomingMessage<ReadState[]>) => {
      setData(makeEntries(body));
      setIsLoading(false);
    };

    const upHistory = ({ body }: IncomingMessage<ReadState>) => {
      if (!body) return;
      setData(prevState => {
        let entries = prevState;

        const entry = prevState[body.mangaId];
        if (entry) {
          const idx = entry.histories.findIndex(h => h.id === body.id);
          if (idx >= 0) {
            const history = { ...entry.histories.splice(idx, 1)[0] };
            entry.histories.unshift(Object.assign(history, body));
            entries = { [entry.id]: entry, ...prevState };
          }
        } else {
          GetHistory();
        }

        return entries;
      });
    };

    const upHistories = ({ body }: IncomingMessage<ReadState[]>) => {
      if (!body) return;
      setData(prevState => {
        let entries = prevState;

        for (let i = 0; i < body.length; i++) {
          const entry = prevState[body[i].mangaId];
          if (entry) {
            const idx = entry.histories.findIndex(h => h.id === body[i].id);
            if (idx >= 0) {
              const history = { ...entry.histories.splice(idx, 1)[0] };
              entry.histories.unshift(Object.assign(history, body[i]));
              entries = { [entry.id]: entry, ...prevState };
            }
          } else {
            GetHistory();
            break;
          }
        }

        return entries;
      });
    };

    const removers = [
      websocket.Handle(Task.History, updateEntries),

      websocket.Handle(Task.ReadPage, upHistory),
      websocket.Handle(Task.ReadChapter, upHistories),
      websocket.Handle(Task.UnreadChapter, upHistories)
    ];

    GetHistory();
    return () => {
      removers.forEach(remove => remove());
    };
  }, []);

  useEffect(() => {
    const len = Object.keys(data).length;
    if (isLoading || !ref.current || !len || Config.updates.limit * currentPage > len) {
      return undefined;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!mountedRef.current || !entry.isIntersecting) {
          return;
        }
        observer.disconnect();
        setCurrentPage(n => n + 1);
      });
    });

    if (ref.current.lastElementChild) {
      observer.observe(ref.current.lastElementChild);
    }
    return () => {
      observer.disconnect();
    };
  }, [isLoading, currentPage, feed]);

  return (
    <>
      <Helmet>
        <title>History - Nonbiri</title>
      </Helmet>

      <Header />
      <div styleName="history">
        {isLoading ? (
          <Spinner styleName="loading" />
        ) : (
          (() =>
            utils.IsObjectEmpty(data) ? (
              <NotFound title="No history">
                <p>You have not readed any manga.</p>
              </NotFound>
            ) : (
              <>
                <UpdateProgress />
                <div styleName="historyContent" ref={ref}>
                  {feed.map((e, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Entry data={e} key={`${e.id}-${i}`} />
                  ))}
                </div>
              </>
            ))()
        )}
      </div>
    </>
  );
};

export default History;
