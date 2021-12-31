import React, { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import AppContext from "../../AppContext";
import { PageDirection } from "../../constants";
import styles from "../../styles/Reader.less";
import { formatPageURL } from "../../utils/encoding";
import { useIntersectionObserver, useNavigate } from "../../utils/hooks";
import ReaderContext from "./ReaderContext";

const Page = ({ state }: { state: PageState }) => {
  const { reader: pref } = useContext(AppContext).context.prefs;
  const { isTransitionRef, chapterRef, setPages } = useContext(ReaderContext);
  const { prev, next } = useNavigate();

  state.ref = useIntersectionObserver<HTMLDivElement>(
    ({ isIntersecting }) => {
      if (
        !isIntersecting ||
        isTransitionRef.current ||
        state.isViewing ||
        pref.direction !== PageDirection.TopToBottom
      ) {
        return;
      }
      setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === state.num }))));
    },
    { rootMargin: "0px 0px -100% 0px" }
  );
  const { ref } = state;

  const imageRef = useRef<HTMLImageElement>();
  const src = useMemo(
    () => formatPageURL(chapterRef.current.hash, chapterRef.current.pages[state.num - 1]),
    [chapterRef.current.pages, chapterRef.current.hash, state]
  );

  const remainderRef = useRef(0);
  const lastPosRef = useRef(0);
  const posRef = useRef(0);
  const isDragRef = useRef<boolean>();

  const scrollIntoView = useCallback(() => {
    const { top } = document.body.getBoundingClientRect();
    let offset: number;
    if (imageRef.current) {
      offset = imageRef.current.getBoundingClientRect().top;
    } else {
      offset = ref.current.getBoundingClientRect().top;
    }
    window.scrollTo({ top: offset - top });
  }, []);

  /**
   * Page navigation on click
   *
   * Navigate between pages by clicking the image,
   * abort if user is dragging the image.
   */
  const onClick = useCallback(
    (ev: React.MouseEvent) => {
      if (isDragRef.current) return;

      const target = (ev.target instanceof HTMLImageElement ? ev.target.parentElement : ev.target) as HTMLDivElement;
      let isPrev = ev.screenX - target.getBoundingClientRect().x <= target.clientWidth / 2;
      if (pref.direction === PageDirection.RightToLeft) {
        isPrev = !isPrev;
      }

      if (isPrev) prev();
      else next();
    },
    [pref, prev, next]
  );

  /**
   * Image dragging
   *
   * Below here is for anything that related to image dragging.
   */

  const onDrag = useCallback((ev: MouseEvent) => {
    // Maybe unnecessary
    remainderRef.current = ref.current.clientWidth - imageRef.current.clientWidth;

    const nextPos = posRef.current + (ev.clientX - lastPosRef.current);
    if (nextPos >= remainderRef.current && nextPos <= 0) {
      posRef.current = nextPos;
      imageRef.current.style.left = `${posRef.current}px`;
    }

    lastPosRef.current = ev.clientX;
    isDragRef.current = true;
  }, []);

  const onRelease = useCallback((ev: Event) => {
    /**
     * Because of event bubbling, onRelease and OnClick will be fired.
     * So when `isDragRef.current` is false, page navigation event will be fired.
     * The issue is: onRelease will be fired before OnClick event.
     *
     * pseudocode:
     *
     *    onRelease:
     *      set isDragRef.current to false
     *    then OnClick:
     *      fire page navigation if isDragRef.current is false
     *
     * As the workaround, we use window.setTimeout with 0ms delay.
     * It allows us to set isDragRef.current to false ONLY AFTER
     * OnClick event is being fired.
     */
    window.setTimeout(() => (isDragRef.current = false), 0);

    ref.current.removeEventListener("mouseup", onRelease);
    ref.current.removeEventListener("mousemove", onDrag);
    ref.current.removeEventListener("mouseleave", onRelease);
    ref.current.removeEventListener("pointerup", onRelease);
    ref.current.removeEventListener("pointermove", onDrag);
    ref.current.removeEventListener("pointerleave", onRelease);
  }, []);

  const onPress = useCallback((ev: MouseEvent) => {
    lastPosRef.current = ev.clientX;

    ref.current.addEventListener("mouseup", onRelease);
    ref.current.addEventListener("mousemove", onDrag);
    ref.current.addEventListener("mouseleave", onRelease);
    ref.current.addEventListener("pointerup", onRelease);
    ref.current.addEventListener("pointermove", onDrag);
    ref.current.addEventListener("pointerleave", onRelease);
  }, []);

  const calcRemainder = useCallback(() => {
    if (!ref.current || !imageRef.current) {
      return;
    }

    remainderRef.current = ref.current.clientWidth - imageRef.current.clientWidth;
    if (remainderRef.current < 0) {
      if (posRef.current < remainderRef.current) {
        posRef.current = remainderRef.current;
      }
      ref.current.classList.add(styles.draggable);
      ref.current.addEventListener("mousedown", onPress);
      ref.current.addEventListener("pointerdown", onPress);
    } else {
      posRef.current = 0;
      ref.current.classList.remove(styles.draggable);
      ref.current.removeEventListener("mousedown", onPress);
      ref.current.removeEventListener("pointerdown", onPress);
    }
    imageRef.current.style.left = `${posRef.current}px`;
  }, []);

  /**
   * Calculate and re-calculate the remainder when:
   * - pref has been changed (max-width, scaling)
   * - image has been downloaded/loaded
   * - resizing and transitioning (toggling sidebar)
   */
  useEffect(() => {
    if (!ref.current || !imageRef.current) {
      return undefined;
    }

    const container = ref.current.parentElement.parentElement;

    calcRemainder();
    window.addEventListener("resize", calcRemainder);
    container.addEventListener("transitionend", calcRemainder);

    return () => {
      window.removeEventListener("resize", calcRemainder);
      container.removeEventListener("transitionend", calcRemainder);
    };
  }, [ref.current, imageRef.current, pref, state.isDownloaded]);

  /**
   * OnMount
   *
   * (Top-to-bottom mode)
   * Restore scroll position to the last viewed page
   */

  useEffect(() => {
    if (!state.isViewing || pref.direction !== PageDirection.TopToBottom) return;
    window.setTimeout(scrollIntoView, 0);
  }, []);

  /**
   *  (Left-to-right or right-to-left mode)
   *  Reset scroll position when navigating.
   */
  useEffect(() => {
    if (!state.isViewing || pref.direction === PageDirection.TopToBottom) {
      return;
    }
    scrollIntoView();
  }, [state.isViewing]);

  if (pref.direction !== PageDirection.TopToBottom && !state.isViewing) {
    return null;
  }
  return (
    <div styleName="page" data-loading={!state.isDownloaded || undefined} ref={ref}>
      <div styleName="wrapper" onClickCapture={pref.navigateOnClick ? onClick : undefined}>
        {state.isDownloaded && <img src={src} ref={imageRef} />}
      </div>
    </div>
  );
};

export default Page;
