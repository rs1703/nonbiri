import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AppContext from "../../AppContext";
import { routes } from "../../Config";
import { PageDirection, PageScale } from "../../constants";
import "../../styles/Reader.less";
import { loadImage } from "../../utils";
import { formatPageURL } from "../../utils/encoding";
import { useMounted } from "../../utils/hooks";
import Anchor from "../Anchor";
import NotFound from "../NotFound";
import Spinner from "../Spinner";
import Page from "./Page";
import ReaderContext from "./ReaderContext";

const Main = () => {
  const { reader: pref } = useContext(AppContext).context.prefs;
  const { isLoading, isUpdating, isTransitionRef, dataRef, chapterRef, nextChapter, pages, currentPage, setPages } =
    useContext(ReaderContext);

  const mountedRef = useMounted();
  const queueRef = useRef<number[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const parallelSizeRef = useRef(0);

  const styles: any = useMemo(() => {
    const maxWidth = Number(pref.maxWidth);
    const maxHeight = Number(pref.maxHeight);
    return {
      "--gaps": `${Number(pref.gaps) / 10}rem`,
      "--zoom": pref.zoom,
      "--max-width": maxWidth ? `${maxWidth / 10}rem` : undefined,
      "--max-height": maxHeight ? `${maxHeight / 10}rem` : undefined
    };
  }, [pref.gaps, pref.maxHeight, pref.maxWidth, pref.zoom]);

  useEffect(() => {
    if (isLoading || isUpdating || !chapterRef.current?.pages?.length || !pages || !currentPage) {
      return;
    }

    const logQueue = (pageNum: number) => {
      console.info(
        "[Reader] Page %d has been added to queue | Queue size: %d/%d",
        pageNum,
        queueRef.current.length,
        pref.maxPreloads
      );
    };

    queueRef.current = queueRef.current.filter(q => !pages[q - 1].isDownloaded && !pages[q - 1].isFailed);

    const currentIdx = currentPage.num - 1;
    if (!currentPage.isDownloaded && !queueRef.current.includes(currentPage.num)) {
      queueRef.current.push(currentPage.num);
      logQueue(currentPage.num);
    }

    for (let i = 1; queueRef.current.length <= pref.maxPreloads && i <= pref.maxPreloads; i++) {
      const prev = pages[currentIdx - i];
      if (prev && !prev.isDownloaded && !queueRef.current.includes(prev.num)) {
        queueRef.current.push(prev.num);
        logQueue(prev.num);
      }

      if (queueRef.current.length < pref.maxPreloads) {
        const next = pages[currentIdx + i];
        if (next && !next.isDownloaded && !queueRef.current.includes(next.num)) {
          queueRef.current.push(next.num);
          logQueue(next.num);
        }
      }
    }
    if (queueRef.current.length !== queue.length || !queueRef.current.every(n => queue.includes(n))) {
      setQueue(Array.from(queueRef.current));
    }
  }, [isLoading, isUpdating, chapterRef.current?.pages, pages, currentPage, pref.maxPreloads]);

  useEffect(() => {
    if (
      isLoading ||
      isUpdating ||
      !chapterRef.current?.pages?.length ||
      !pages ||
      !queueRef.current.length ||
      parallelSizeRef.current >= pref.maxParallel
    ) {
      return;
    }

    for (let i = 0; i < queueRef.current.length && parallelSizeRef.current < pref.maxParallel; i++) {
      const idx = queueRef.current[i] - 1;
      const page = pages[idx];
      if (!page.isDownloaded && !page.isDownloading) {
        page.isDownloading = true;
        parallelSizeRef.current++;

        console.info(
          "[Reader] Preloading page %d | Parallel size: %d/%d",
          page.num,
          parallelSizeRef.current,
          pref.maxParallel
        );

        (async () => {
          await loadImage(formatPageURL(chapterRef.current.hash, chapterRef.current.pages[idx]), mountedRef)
            .then(() => (page.isDownloaded = true))
            .catch(() => (page.isFailed = true));
          if (!mountedRef.current) return;

          page.isDownloading = false;
          parallelSizeRef.current--;

          if (page.isDownloaded) {
            console.info(
              "[Reader] Page %d has been preloaded | Parallel size: %d/%d",
              page.num,
              parallelSizeRef.current,
              pref.maxParallel
            );
          } else {
            console.info(
              "[Reader] Failed to preload %d | Parallel size: %d/%d",
              page.num,
              parallelSizeRef.current,
              pref.maxParallel
            );
          }

          setPages(prevState => {
            const prev = prevState.find(p => p.num === page.num);
            if (prev) {
              Object.assign(prev, {
                isDownloaded: page.isDownloaded,
                isDownloading: page.isDownloading,
                isFailed: page.isFailed
              } as PageState);
            }
            return Array.from(prevState);
          });
        })();
      }
    }
  }, [isLoading, isUpdating, chapterRef.current?.pages, queue, pref.maxParallel]);

  /**
   * Preserve relative scroll position when resizing window,
   * changing page direction and toggling sidebar.
   *
   * TODO FIX: Right now it's really clunky when resizing and
   * toggling sidebar.
   */

  const ref = useRef<HTMLDivElement>();
  const offsetRef = useRef(0);

  const restoreScrollPos = useCallback(() => {
    if (!currentPage?.ref?.current) return;
    if (offsetRef.current > 0) {
      currentPage.ref.current.scrollIntoView();
    } else {
      const { top } = document.body.getBoundingClientRect();
      const offset = currentPage.ref.current.getBoundingClientRect().top;

      window.scrollTo({ top: offset - top - offsetRef.current });
      if (!isTransitionRef.current) {
        window.setTimeout(() => (offsetRef.current = offset), 0);
      }
    }
  }, [currentPage?.ref?.current]);

  /**
   * Store scroll position when scrolling.
   * Abort during transition (toggling sidebar).
   */
  useEffect(() => {
    const onScroll = () => {
      if (!currentPage?.ref?.current || isTransitionRef.current) return;
      offsetRef.current = currentPage.ref.current.getBoundingClientRect().top;
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [currentPage?.ref?.current]);

  /**
   * Restore scroll position when changing page direction
   * and toggling sidebar.
   *
   * When toggling sidebar, scroll position will be restored
   * after transition has ended.
   */
  useEffect(() => {
    restoreScrollPos();

    const onTransitionStart = () => {
      isTransitionRef.current = true;
    };

    const onTransitionEnd = () => {
      restoreScrollPos();
      window.setTimeout(() => (isTransitionRef.current = false), 0);
    };

    ref.current.addEventListener("transitionstart", onTransitionStart);
    ref.current.addEventListener("transitionend", onTransitionEnd);
    return () => {
      if (!ref.current) return;

      ref.current.removeEventListener("transitionstart", onTransitionStart);
      ref.current.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [pref.direction, pref.showSidebar]);

  // Restore scroll position when resizing
  useEffect(() => {
    window.addEventListener("resize", restoreScrollPos);
    return () => {
      window.removeEventListener("resize", restoreScrollPos);
    };
  }, [restoreScrollPos]);

  return (
    <div styleName="main" ref={ref}>
      {isLoading || (isUpdating && !chapterRef.current?.pages?.length) ? (
        <Spinner styleName="loading" />
      ) : (
        (() =>
          chapterRef.current?.pages?.length ? (
            <>
              <div
                styleName="pages"
                data-scale={PageScale[pref.scale]}
                data-single={pref.direction !== PageDirection.TopToBottom || undefined}
                style={styles}
              >
                {pages.map(s => (
                  <Page state={s} key={s.num} />
                ))}
              </div>

              {(pref.direction === PageDirection.TopToBottom || currentPage?.num === pages?.length) && (
                <div styleName="end">
                  {nextChapter ? (
                    <Anchor
                      to={{
                        pathname: `${routes.reader}/${dataRef.current.id}/${nextChapter.id}`,
                        state: { data: dataRef.current }
                      }}
                    >
                      Next Chapter
                    </Anchor>
                  ) : (
                    <strong>END</strong>
                  )}
                </div>
              )}
            </>
          ) : (
            <NotFound>
              <p>Chapter does not exists</p>
            </NotFound>
          ))()
      )}
    </div>
  );
};

export default Main;
