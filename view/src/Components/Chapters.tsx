import React, { Context, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BiHide, BiPencil, BiShow, BiSort } from "react-icons/bi";
import { IoMdRefresh } from "react-icons/io";
import { routes } from "../Config";
import styles from "../styles/Chapters.less";
import { formatChapter, formatDate, formatGroups } from "../utils/encoding";
import { useIntersectionObserver, useModal, useMounted } from "../utils/hooks";
import { ReadChapter, UnreadChapter, UpdateChapters } from "../websocket";
import Anchor from "./Anchor";
import Spinner from "./Spinner";

interface ItemProps {
  isActive?: boolean;
  data: Manga;
  chapter: Chapter;
}

const Item = ({ isActive, data, chapter }: ItemProps) => {
  const mountedRef = useMounted();

  const [isVisible, setIsVisible] = useState<boolean>();
  const ref = useIntersectionObserver<HTMLLIElement>(
    () => {
      if (!mountedRef.current) return;
      setIsVisible(true);
    },
    { once: true }
  );

  const isUpdatingRef = useRef<boolean>();
  const updateReadState = useCallback(async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    let error: string;
    if (!chapter?.history?.readed) {
      ({ error } = await ReadChapter(chapter.id));
    } else {
      ({ error } = await UnreadChapter(chapter.id));
    }

    if (!mountedRef.current) return;
    if (error) console.error(error);
    isUpdatingRef.current = false;
  }, [chapter]);

  useEffect(() => {
    if (!isActive) return;
    ref.current.scrollIntoView({ block: "center" });
  }, []);

  useEffect(() => {
    if (ref.current && mountedRef.current && isVisible) {
      ref.current.classList.remove(styles.hidden);
    }
  }, [isVisible]);

  return (
    <li
      styleName="hidden"
      data-active={isActive || undefined}
      data-readed={chapter.history?.readed || undefined}
      ref={ref}
    >
      {isVisible && (
        <>
          <Anchor
            to={chapter.externalURL || { pathname: `${routes.reader}/${data.id}/${chapter.id}`, state: { data } }}
          >
            <h3 styleName="name">{formatChapter(chapter)}</h3>
            <span styleName="info">
              {formatDate(chapter.publishAt)}
              {chapter && !chapter.history?.readed && chapter.history?.lastViewed > 1 && (
                <>
                  {" • "}
                  <span styleName="progress">
                    Progress: {chapter.history.lastViewed}/{chapter.pages.length}
                  </span>
                </>
              )}
              {" • "}
              {formatGroups(chapter.groups)}
            </span>
          </Anchor>
          <button
            type="button"
            title={chapter?.history?.readed ? "Mark as unreaded" : "Mark as readed"}
            onClick={updateReadState}
          >
            {chapter?.history?.readed ? <BiHide /> : <BiShow />}
          </button>
        </>
      )}
    </li>
  );
};

interface ChaptersProps extends Props<HTMLDivElement> {
  chapterId?: string;
  context: Context<ReaderContext | MangaContext>;
}

const Chapters = ({ chapterId, context, ...props }: ChaptersProps) => {
  const { mountedRef, isLoading, isUpdating, dataRef, setIsUpdating } = useContext(context);
  const [isReverse, setIsReverse] = useState<boolean>();
  const mutex = useRef<boolean>();

  const ref = useRef<HTMLUListElement>();
  const [isVisible, setIsVisible] = useState<boolean>();

  const chapters = useMemo(
    () => (isReverse ? Array.from(dataRef.current?.chapters || []).reverse() : dataRef.current?.chapters || []),
    [dataRef.current, dataRef.current?.chapters, isReverse]
  );
  const hasChapters = useMemo(() => !!chapters?.length, [chapters]);

  const updateChapters = useCallback(async () => {
    if (isLoading || isUpdating) {
      return;
    }
    setIsUpdating(true);

    const { error } = await UpdateChapters(dataRef.current.id);
    if (!mountedRef.current) return;
    if (error) console.error(error);
    setIsUpdating(false);
  }, [isLoading, isUpdating, setIsUpdating]);

  const changeReadStates = useCallback(
    async (read?: boolean) => {
      if (isLoading || mutex.current) {
        return;
      }
      mutex.current = true;

      const fn = read ? ReadChapter : UnreadChapter;
      await fn(...dataRef.current.chapters.map(c => c.id));
      mutex.current = false;
    },
    [isLoading]
  );

  useModal(ref, isVisible, setIsVisible);

  return (
    <div {...props} styleName="chapters">
      {(!isLoading || hasChapters) && (
        <div styleName="header">
          <h2>Chapters{hasChapters && ` (${dataRef.current.chapters.length})`}</h2>
          <div styleName="actions">
            {hasChapters && (
              <>
                <div styleName="changeReadState">
                  <button type="button" title="Change read states" onClick={() => setIsVisible(!isVisible)}>
                    <BiPencil />
                  </button>
                  {isVisible && (
                    <ul styleName="pop" ref={ref}>
                      <li>
                        <button type="button" onClick={() => changeReadStates(true)}>
                          Read all chapters
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => changeReadStates()}>
                          Unread all chapters
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
                <button
                  styleName="sort"
                  data-active={isReverse || undefined}
                  type="button"
                  title="Sort"
                  onClick={() => setIsReverse(!isReverse)}
                >
                  <BiSort />
                </button>
              </>
            )}
            <button
              styleName="update"
              data-active={isUpdating || undefined}
              type="button"
              title="Check for updates"
              onClick={updateChapters}
            >
              <IoMdRefresh />
            </button>
          </div>
        </div>
      )}
      <div>
        {(() => {
          if (hasChapters) {
            return (
              <ul styleName="list">
                {chapters.map(chapter => (
                  <Item data={dataRef.current} chapter={chapter} isActive={chapter.id === chapterId} key={chapter.id} />
                ))}
              </ul>
            );
          }
          return isLoading ? (
            <Spinner styleName="loading" />
          ) : (
            <div styleName="empty">
              <p>No chapters.</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Chapters;
