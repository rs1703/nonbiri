import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { BiHide, BiShow } from "react-icons/bi";
import Config, { routes } from "../Config";
import { Task } from "../constants";
import styles from "../styles/History.less";
import { deepClone, formatChapter, formatDate, formatGroups, formatThumbnailURL } from "../utils/encoding";
import { useIntersectionObserver, useMounted } from "../utils/hooks";
import websocket, { GetUpdates, ReadChapter, UnreadChapter } from "../websocket";
import Anchor from "./Anchor";
import Header from "./Header";
import NotFound from "./NotFound";
import Picture from "./Picture";
import Spinner from "./Spinner";

interface UpdateEntry {
  id: string;
  cover: string;
  title: string;
  chapters: Chapter[];
}

type UpdateEntries = { [key: string]: UpdateEntry };

const makeEntries = (chapters: Chapter[]) =>
  chapters.reduce<UpdateEntries>((entries, { mangaId: id, cover, mangaTitle: title, ...chapter }) => {
    const entry = (entries[id] ??= { id, cover, title, chapters: [] });
    entry.chapters.push(chapter as Chapter);
    return entries;
  }, {});

const Item = ({ mangaId, data }: { mangaId: string; data: Chapter }) => {
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

  const changeReadState = useCallback(async () => {
    if (mutex.current) return;
    mutex.current = true;

    let error: string;
    if (!data?.history?.readed) {
      ({ error } = await ReadChapter(data.id));
    } else {
      ({ error } = await UnreadChapter(data.id));
    }

    if (!mountedRef.current) return;
    if (error) console.error(error);

    mutex.current = false;
  }, [data]);

  useEffect(() => {
    if (ref.current && mountedRef.current && isVisible) {
      ref.current.classList.remove(styles.hidden);
    }
  }, [isVisible]);

  return (
    <li styleName="hidden" data-readed={data?.history?.readed || undefined} ref={ref}>
      {isVisible && (
        <>
          <Anchor to={`${routes.reader}/${mangaId}/${data.id}`}>
            <h3>{formatChapter(data)}</h3>
            <span styleName="info">
              {formatDate(data.updatedAt || data.createdAt)}
              {" • "}
              {formatGroups(data.groups)}
            </span>
          </Anchor>
          <button
            type="button"
            title={data?.history?.readed ? "Mark as unreaded" : "Mark as readed"}
            onClick={changeReadState}
          >
            {data?.history?.readed ? <BiHide /> : <BiShow />}
          </button>
        </>
      )}
    </li>
  );
};

const MemoizedItem = memo(
  Item,
  (prev, next) =>
    prev.data.history?.readed === next.data?.history.readed &&
    prev.data.history?.updatedAt === next.data?.history.updatedAt
);

const Entry = ({ data }: { data: UpdateEntry }) => {
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
          {data.chapters.map(it => (
            <MemoizedItem mangaId={data.id} data={it} key={it.id} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const Updates = () => {
  const mountedRef = useMounted();
  const ref = useRef<HTMLDivElement>();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<UpdateEntries>({});
  const feed = useMemo(() => Object.values(data).slice(0, Config.updates.limit * currentPage), [currentPage, data]);

  useEffect(() => {
    const synchronizeHistories = ({ body }: IncomingMessage<ReadState[]>) => {
      if (!body) return;
      setData(prevState => {
        for (let i = 0; i < body.length; i++) {
          const entry = prevState[body[i].mangaId];
          if (entry) {
            const idx = entry.chapters.findIndex(c => c.id === body[i].chapterId);
            if (idx >= 0) {
              const clone = deepClone(entry.chapters[idx]);
              Object.assign((clone.history ??= {} as ReadState), body[i]);
              entry.chapters[idx] = clone;
            }
          }
        }
        return { ...prevState };
      });
    };

    const removers = [
      websocket.Handle(Task.ReadChapter, synchronizeHistories),
      websocket.Handle(Task.UnreadChapter, synchronizeHistories)
    ];

    GetUpdates().then(({ response, error }) => {
      if (!mountedRef.current) return;
      if (response) {
        setData(() => makeEntries(response));
      } else if (error) {
        console.error(error);
      }
      setIsLoading(false);
    });

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
        <title>Updates - Nonbiri</title>
      </Helmet>

      <Header />

      <div styleName="updates">
        {isLoading ? (
          <Spinner styleName="loading" />
        ) : (
          (() =>
            feed?.length ? (
              <div styleName="updatesContent" ref={ref}>
                {feed.map((e, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Entry data={e} key={`${e.id}-${i}`} />
                ))}
              </div>
            ) : (
              <NotFound title="No updates">
                <p>There are no updates</p>
              </NotFound>
            ))()
        )}
      </div>
    </>
  );
};

export default Updates;
