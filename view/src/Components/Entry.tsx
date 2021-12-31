import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { routes } from "../Config";
import { Errors, FollowState } from "../constants";
import styles from "../styles/Entry.less";
import { formatThumbnailURL } from "../utils/encoding";
import { useIntersectionObserver, useMounted } from "../utils/hooks";
import { FollowManga, UnfollowManga, UpdateManga } from "../websocket";
import Anchor from "./Anchor";
import Picture from "./Picture";
import Spinner from "./Spinner";

interface EntryContext {
  isBrowse?: boolean;
  manga: Manga;
}

interface FollowButtonProps extends EntryContext, Props<HTMLButtonElement> {
  mountedRef: Mutable<boolean>;
}

const FollowButton = ({ mountedRef, manga, ...props }: FollowButtonProps) => {
  const timeoutRef = useRef(0);
  const [isHover, setIsHover] = useState<boolean>();
  const [isUpdating, setIsUpdating] = useState<boolean>();

  const pushState = useCallback(async () => {
    let error: string;
    if (manga.followed) {
      ({ error } = await UnfollowManga(manga.id));
    } else {
      ({ error } = await FollowManga(manga.id, FollowState.Reading));
    }
    if (!mountedRef.current) return;

    if (error) {
      switch (error) {
        case Errors.MangaNotFound: {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const { response, error } = await UpdateManga(manga.id);
          if (!mountedRef.current) return;
          if (response) {
            pushState();
            return;
          }
          if (error) console.error(error);
          break;
        }
        default:
          console.error(error);
          break;
      }
    }

    clearTimeout(timeoutRef.current);
    if (timeoutRef.current === 1) {
      setIsUpdating(false);
    }
    timeoutRef.current = 0;
  }, [manga.followed]);

  const updateState = useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault();
      if (isUpdating || timeoutRef.current) {
        return;
      }
      timeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setIsUpdating(true);
        timeoutRef.current = 1;
      }, 250);
      pushState();
    },
    [isUpdating, pushState]
  );

  return (
    <button
      type="button"
      data-updating={isUpdating || undefined}
      {...props}
      onClick={updateState}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {(() => {
        if (isUpdating) {
          return <Spinner styleName="loading" strokeWidth="1.2rem" />;
        }
        return (manga.followed && !isHover) || (!manga.followed && isHover) ? (
          <IoHeart title="Follow" />
        ) : (
          <IoHeartOutline title="Unfollow" />
        );
      })()}
    </button>
  );
};

const Entry = ({ isBrowse, manga: data, ...props }: EntryContext & Props<HTMLDivElement>) => {
  const mountedRef = useMounted();
  const timeoutRef = useRef(0);

  const [isVisible, setIsVisible] = useState<boolean>();
  const thumbnailURL = useMemo(() => formatThumbnailURL(data), [data]);

  const ref = useIntersectionObserver<HTMLDivElement>(entry => {
    clearTimeout(timeoutRef.current);
    if (!mountedRef.current) return;
    if (entry.isIntersecting) {
      setIsVisible(true);
    } else {
      timeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setIsVisible(false);
      }, 15 * 1000);
    }
  });

  const unreadedChapters = useMemo(
    () => data.totalChapters - data.readedChapters,
    [data.readedChapters, data.totalChapters]
  );

  const frameRef = useRef(0);
  useEffect(() => {
    if (!ref.current) return;
    clearTimeout(frameRef.current);
    frameRef.current = window.setTimeout(() => {
      if (!ref.current || !mountedRef.current) return;
      if (isVisible) {
        ref.current.classList.remove(styles.hidden);
      } else {
        ref.current.classList.add(styles.hidden);
      }
    }, 0);
  }, [isVisible]);

  return (
    <div
      {...props}
      styleName="entry hidden"
      data-unfollowed={(!isBrowse && !data.followed) || undefined}
      data-followed={(isBrowse && data.followed) || undefined}
      ref={ref}
    >
      {isVisible && (
        <Anchor to={{ pathname: `${routes.manga}/${data.id}`, state: { data } }}>
          <Picture src={thumbnailURL} div />
          <div styleName="metadata">
            <div styleName="top">
              {!isBrowse && !!unreadedChapters && (
                <span
                  styleName="unreadedChapters"
                  title={`${unreadedChapters} unreaded chapter${unreadedChapters > 1 ? "s" : ""}`}
                >
                  {unreadedChapters}
                </span>
              )}
              <FollowButton styleName="followState" mountedRef={mountedRef} manga={data} />
            </div>
            <div styleName="bottom">
              <h2 styleName="title" title={data.title}>
                {data.title}
              </h2>
            </div>
          </div>
        </Anchor>
      )}
    </div>
  );
};

export default Entry;
