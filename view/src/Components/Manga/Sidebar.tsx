import React, { useContext, useMemo, useRef, useState } from "react";
import { BiChevronDown } from "react-icons/bi";
import { Demographic, FollowState, FollowStateKeys, Language, Rating, Status } from "../../constants";
import styles from "../../styles/Manga.less";
import { isLink } from "../../utils";
import { formatThumbnailURL } from "../../utils/encoding";
import { useModal } from "../../utils/hooks";
import { FollowManga, UnfollowManga } from "../../websocket";
import Picture from "../Picture";
import Spinner from "../Spinner";
import MangaContext from "./MangaContext";

const externalBaseURLS = {
  al: ["AniList", "https://anilist.co/manga/:1"],
  ap: ["Anime-Planet", "https://www.anime-planet.com/manga/:1"],
  bw: ["BOOK☆WALKER", "https://bookwalker.jp/:1"],
  mu: ["MangaUpdates", "https://www.mangaupdates.com/series.html?id=:1"],
  nu: ["NovelUpdates", "https://www.novelupdates.com/series/:1"],
  kt: ["Kitsu", "https://kitsu.io/api/edge/manga/:1"],
  amz: ["Amazon", undefined],
  ebj: ["eMangaJapan", undefined],
  mal: ["MyAnimeList", "https://myanimelist.net/manga/:1"],
  raw: ["RAW", undefined],
  engtl: ["Official English Translation", undefined]
};

const FollowStateButton = (props: Props<HTMLDivElement>) => {
  const { mountedRef, dataRef } = useContext(MangaContext);

  const popRef = useRef<HTMLUListElement>();
  const timeoutRef = useRef(0);

  const [isUpdating, setIsUpdating] = useState<boolean>();
  const [isPop, setIsPop] = useState<boolean>();

  const changeFollowState = async (v?: FollowState) => {
    if (isUpdating || timeoutRef.current) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setIsUpdating(true);
      timeoutRef.current = 1;
    }, 250);

    const { error } = await (dataRef.current.followed && !v
      ? UnfollowManga(dataRef.current.id)
      : FollowManga(dataRef.current.id, v || FollowState.Reading));
    if (!mountedRef.current) return;
    if (error) console.error(error);

    clearTimeout(timeoutRef.current);
    if (timeoutRef.current === 1) {
      setIsUpdating(false);
    }
    timeoutRef.current = 0;
  };

  useModal(popRef, isPop, setIsPop);

  return (
    <div {...props}>
      <button type="button" onClick={() => changeFollowState()}>
        {(() => {
          if (isUpdating) {
            return <Spinner styleName="loading" />;
          }
          return dataRef.current.followed ? FollowState[dataRef.current.followState] : "Add to List";
        })()}
      </button>
      <div styleName="options">
        <button type="button" onClick={() => setIsPop(!isPop)}>
          <BiChevronDown />
        </button>
        {isPop && (
          <ul styleName="pop" ref={popRef}>
            {FollowStateKeys.map(k => (
              <li key={k}>
                <button type="button" onClick={() => changeFollowState(FollowState[k])}>
                  <span>Set as {k}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { dataRef } = useContext(MangaContext);

  const ref = useRef<HTMLDivElement>();
  const coverRef = useRef<HTMLDivElement>();
  const thumbnail = useMemo(() => formatThumbnailURL(dataRef.current), [dataRef]);

  const md = useMemo<any[]>(
    () =>
      [
        ["Status in Country of Origin", Status, dataRef.current.status],
        ["Original Language", Language, dataRef.current.origin],
        ["Demographic", Demographic, dataRef.current.demographic],
        ["Rating", Rating, dataRef.current.rating]
      ].filter(([, , v]) => !!v),
    [dataRef]
  );

  return (
    <div styleName="sidebar" ref={ref}>
      <div styleName="cover loading" ref={coverRef}>
        <Picture
          src={thumbnail}
          onSuccess={({ height }: HTMLImageElement) => {
            coverRef.current.classList.remove(styles.loading);
            if (height <= 256) {
              ref.current.classList.add(styles.small);
            }
          }}
        />
      </div>

      <div styleName="actions">
        <FollowStateButton styleName="followState" />
      </div>

      <ul styleName="metadata">
        {md.map(([title, t, v]) => (
          <li key={title}>
            <strong>{title}</strong>
            <div>
              <span>{t[v]}</span>
            </div>
          </li>
        ))}

        {dataRef.current.artists?.length && (
          <li>
            <strong>Artist{dataRef.current.artists.length > 1 && "s"}</strong>
            <div>
              {dataRef.current.artists.map((artist, i) => (
                <span key={artist.id}>
                  {artist.name}
                  {i < dataRef.current.artists.length - 1 && ", "}
                </span>
              ))}
            </div>
          </li>
        )}

        {dataRef.current.authors?.length && (
          <li>
            <strong>Author{dataRef.current.authors.length > 1 && "s"}</strong>
            <div>
              {dataRef.current.authors.map((author, i) => (
                <span key={author.id}>
                  {author.name}
                  {i < dataRef.current.authors.length - 1 && ", "}
                </span>
              ))}
            </div>
          </li>
        )}

        {dataRef.current.tags?.length && (
          <li>
            <strong>Tag{dataRef.current.tags.length && "s"}</strong>
            <div>
              {dataRef.current.tags.map((tag, i) => (
                <span key={tag}>
                  {tag}
                  {i < dataRef.current.tags.length - 1 && ", "}
                </span>
              ))}
            </div>
          </li>
        )}

        {!!Object.keys(dataRef.current.links || {}).length && (
          <li>
            <strong>Links</strong>
            <ul>
              {Object.keys(dataRef.current.links).map(k => {
                const [name, url] = externalBaseURLS[k];
                return (
                  <li key={k}>
                    {isLink(k) ? (
                      <a href={k} target="_blank" rel="noreferrer">
                        {name}
                      </a>
                    ) : (
                      <a
                        href={url ? url.replace(":1", dataRef.current.links[k]) : dataRef.current.links[k]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {name}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
