import React, { memo, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  BiChevronDown,
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
  BiCog,
  BiFileBlank,
  BiX
} from "react-icons/bi";
import { IoMdPeople } from "react-icons/io";
import AppContext from "../../AppContext";
import { routes } from "../../Config";
import { PageDirection, PageScale, SidebarPosition, SidebarPositionKeys } from "../../constants";
import "../../styles/Reader.less";
import { formatChapter, formatGroups } from "../../utils/encoding";
import { useKeydown, useModal, useMutableHistory, useNavigate } from "../../utils/hooks";
import { UpdateReaderPreference } from "../../websocket";
import Anchor from "../Anchor";
import Chapters from "../Chapters";
import ReaderContext from "./ReaderContext";

const directions: [string, PageDirection][] = [
  ["Top-to-bottom", PageDirection.TopToBottom],
  ["Right-to-left", PageDirection.RightToLeft],
  ["Left-to-right", PageDirection.LeftToRight]
];

const scales: [string, string, PageScale][] = [
  ["Default", "Keep original sizes, fit to container width if larger", PageScale.Default],
  ["Original", "Keep original sizes", PageScale.Original],
  ["Width", "Fit to max-width if larger", PageScale.Width],
  ["Height", "Fit to max-height if larger", PageScale.Height],
  ["Stretch", "Stretch to max-width", PageScale.Stretch],
  ["Fit Width", "Fit to screen width if larger", PageScale.FitWidth],
  ["Fit Height", "Fit to screen height if larger", PageScale.FitHeight],
  ["Stretch Width", "Stretch to screen width", PageScale.StretchWidth],
  ["Stretch Height", "Stretch to screen height", PageScale.StretchHeight]
];

const noop = () => {};

const Sidebar = () => {
  const historyRef = useMutableHistory();

  const { reader: pref } = useContext(AppContext).context.prefs;
  const { sidebarPosition, showSidebar } = pref;
  const isReverse = pref.direction === PageDirection.RightToLeft;

  const { dataRef, chapterRef, prevChapter, nextChapter, pages, currentPage } = useContext(ReaderContext);
  const { first, prev, next, last, jump } = useNavigate();

  const isUpdatingRef = useRef<boolean>();
  const popRef = useRef<HTMLDivElement>();
  const timeoutRef = useRef(0);

  const [isSettingsPop, setIsSettingsPop] = useState<boolean>();
  const [isChaptersPop, setIsChaptersPop] = useState<boolean>();

  const title = useMemo(() => formatChapter(chapterRef.current), [chapterRef.current]);
  const groups = useMemo(() => formatGroups(chapterRef.current?.groups), [chapterRef.current?.groups]);

  const pushPreference = useCallback(
    async (v: any) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      await UpdateReaderPreference({ ...pref, ...v });
      isUpdatingRef.current = false;
    },
    [pref]
  );

  const changePreference = useCallback(
    (ev: React.FormEvent, isNumber?: boolean) => {
      const target = ev.target as HTMLInputElement;
      if (!target.value) return;
      clearTimeout(timeoutRef.current);

      const { type, name, checked } = target;
      if (target.type === "number") {
        const n = Number(target.value);
        if (target.min && n < Number(target.min)) {
          target.value = target.min;
        } else if (target.max && n > Number(target.max)) {
          target.value = target.max;
        }
      }

      timeoutRef.current = window.setTimeout(() => {
        if (type === "checkbox") {
          pushPreference({ [name]: checked });
        } else {
          pushPreference({ [name]: isNumber ? Number(target.value) : target.value });
        }
      }, 250);
    },
    [pushPreference]
  );

  const changeKeybind = useCallback(
    (ev: React.KeyboardEvent) => {
      clearTimeout(timeoutRef.current);
      const { name } = ev.target as HTMLInputElement;
      timeoutRef.current = window.setTimeout(() => {
        pushPreference({
          keybinds: {
            ...pref.keybinds,
            [name]: ev.code
          }
        });
      }, 250);
    },
    [pref.keybinds, pushPreference]
  );

  useKeydown(ev => {
    if (isChaptersPop || isSettingsPop) {
      return;
    }
    switch (ev.code) {
      case pref.keybinds.previousPage:
        prev();
        break;
      case pref.keybinds.nextPage:
        next();
        break;
      case pref.keybinds.previousChapter:
        if (!prevChapter) break;
        historyRef.current.push(`${routes.reader}/${dataRef.current.id}/${prevChapter.id}`, { data: dataRef });
        break;
      case pref.keybinds.nextChapter:
        if (!nextChapter) break;
        historyRef.current.push(`${routes.reader}/${dataRef.current.id}/${nextChapter.id}`, { data: dataRef });
        break;
      default:
        break;
    }
  });

  useModal(popRef, isChaptersPop, setIsChaptersPop);
  useModal(popRef, isSettingsPop, setIsSettingsPop);

  return (
    <div styleName="sidebar" data-position={SidebarPosition[sidebarPosition]} data-hidden={!showSidebar || undefined}>
      <div styleName="header">
        <Anchor
          styleName="title"
          to={{ pathname: `${routes.manga}/${dataRef.current.id}`, state: { data: dataRef } }}
          title={dataRef.current.title}
        >
          {dataRef.current.title}
        </Anchor>
        <nav styleName="chapterNavigation">
          <Anchor
            to={
              prevChapter
                ? { pathname: `${routes.reader}/${dataRef.current.id}/${prevChapter.id}`, state: { data: dataRef } }
                : undefined
            }
            title="Previous chapter"
            data-disabled={!prevChapter}
          >
            Previous
          </Anchor>
          <Anchor
            to={
              nextChapter
                ? { pathname: `${routes.reader}/${dataRef.current.id}/${nextChapter.id}`, state: { data: dataRef } }
                : undefined
            }
            title="Next chapter"
            data-disabled={!nextChapter}
          >
            Next
          </Anchor>
        </nav>
      </div>
      <div styleName="body flex cols">
        <div styleName="fill">
          {chapterRef.current && (
            <button styleName="metadata block w-full" type="button" onClick={() => setIsChaptersPop(!isChaptersPop)}>
              <div>
                <BiFileBlank />
                <span>{title}</span>
              </div>
              <div>
                <IoMdPeople />
                <span>{groups}</span>
              </div>
            </button>
          )}
        </div>

        {isChaptersPop && (
          <div styleName="chapters pop">
            <div styleName="popContent" ref={popRef}>
              <Chapters chapterId={chapterRef.current.id} context={ReaderContext} />
            </div>
          </div>
        )}

        <div styleName="settings">
          <button type="button" onClick={() => setIsSettingsPop(!isSettingsPop)}>
            <BiCog />
            <span>Settings</span>
          </button>
          {isSettingsPop && (
            <div styleName="pop">
              <div styleName="popContent" ref={popRef}>
                <div styleName="header flex gap-1">
                  <h2 styleName="fill">Reader Settings</h2>
                  <button styleName="close" type="button" title="Close" onClick={() => setIsSettingsPop(false)}>
                    <BiX />
                  </button>
                </div>
                <div styleName="body">
                  <h3>Sidebar</h3>
                  <div styleName="flex gap-1">
                    <strong>Position</strong>
                    <div styleName="flex fill">
                      <select
                        styleName="fill"
                        name="sidebarPosition"
                        onChange={e => changePreference(e, true)}
                        defaultValue={pref.sidebarPosition}
                      >
                        {SidebarPositionKeys.map(k => (
                          <option key={k} value={SidebarPosition[k]}>
                            {k}
                          </option>
                        ))}
                      </select>
                      <BiChevronDown />
                    </div>
                  </div>

                  <h3>Page</h3>
                  <div styleName="flex gap-1">
                    <strong>Navigate on click</strong>
                    <div styleName="fill align-right">
                      <input
                        type="checkbox"
                        name="navigateOnClick"
                        defaultChecked={pref.navigateOnClick}
                        onChange={changePreference}
                      />
                    </div>
                  </div>
                  <div styleName="flex gap-1">
                    <strong>Direction</strong>
                    <div styleName="flex fill">
                      <select
                        styleName="fill"
                        name="direction"
                        onChange={e => changePreference(e, true)}
                        defaultValue={pref.direction}
                      >
                        {directions.map(([text, v]) => (
                          <option key={PageDirection[v]} value={v}>
                            {text}
                          </option>
                        ))}
                      </select>
                      <BiChevronDown />
                    </div>
                  </div>
                  <div styleName="flex gap-1">
                    <strong>Scale</strong>
                    <div styleName="flex fill">
                      <select
                        styleName="fill"
                        name="scale"
                        onChange={e => changePreference(e, true)}
                        defaultValue={pref.scale}
                      >
                        {scales.map(([text, desc, v]) => (
                          <option key={PageScale[v]} value={v}>
                            {text}
                            {desc && ` (${desc})`}
                          </option>
                        ))}
                      </select>
                      <BiChevronDown />
                    </div>
                  </div>
                  <div styleName="flex gap-1">
                    <div styleName="flex fill gap-1">
                      <strong>Max. width</strong>
                      <div styleName="flex fill">
                        <input
                          styleName="fill"
                          type="number"
                          name="maxWidth"
                          defaultValue={pref.maxWidth}
                          min={0}
                          onChange={changePreference}
                        />
                        <span styleName="unit">px</span>
                      </div>
                    </div>
                    <div styleName="flex fill gap-1">
                      <strong>Max. height</strong>
                      <div styleName="flex fill">
                        <input
                          styleName="fill"
                          type="number"
                          name="maxHeight"
                          defaultValue={pref.maxHeight}
                          min={0}
                          onChange={changePreference}
                        />
                        <span styleName="unit">px</span>
                      </div>
                    </div>
                  </div>
                  <div styleName="flex gap-1">
                    <div styleName="flex fill gap-1 ">
                      <strong>Gaps</strong>
                      <div styleName="flex fill">
                        <input
                          styleName="fill"
                          type="number"
                          name="gaps"
                          defaultValue={pref.gaps}
                          min={10}
                          onChange={changePreference}
                        />
                        <span styleName="unit">px</span>
                      </div>
                    </div>
                    <div styleName="flex fill gap-1 ">
                      <strong>Zoom</strong>
                      <input
                        styleName="fill align-right"
                        type="number"
                        name="zoom"
                        defaultValue={pref.zoom}
                        step={0.1}
                        min={0.1}
                        max={2.0}
                        onChange={changePreference}
                      />
                    </div>
                  </div>

                  <h3>Download</h3>
                  <div styleName="flex gap-1">
                    <div styleName="flex fill gap-1">
                      <strong>Max. preloads</strong>
                      <input
                        styleName="fill align-right"
                        type="number"
                        name="maxPreloads"
                        min={1}
                        defaultValue={pref.maxPreloads}
                        onChange={e => changePreference(e, true)}
                      />
                    </div>
                    <div styleName="flex fill gap-1">
                      <strong>Max. parallels</strong>
                      <input
                        styleName="fill align-right"
                        type="number"
                        name="maxParallel"
                        defaultValue={pref.maxParallel}
                        min={1}
                        onChange={e => changePreference(e, true)}
                      />
                    </div>
                  </div>

                  <h3>Keyboard shortcuts</h3>
                  <div styleName="flex gap-1">
                    <div styleName="flex fill gap-1">
                      <strong>Previous page</strong>
                      <input
                        styleName="fill align-right"
                        name="previousPage"
                        value={pref.keybinds.previousPage}
                        onChange={noop}
                        onKeyDown={changeKeybind}
                      />
                    </div>
                    <div styleName="flex fill gap-1">
                      <strong>Next page</strong>
                      <input
                        styleName="fill align-right"
                        name="nextPage"
                        value={pref.keybinds.nextPage}
                        onChange={noop}
                        onKeyDown={changeKeybind}
                      />
                    </div>
                  </div>
                  <div styleName="flex gap-1">
                    <div styleName="flex fill gap-1">
                      <strong>Previous chapter</strong>
                      <input
                        styleName="fill align-right"
                        name="previousChapter"
                        value={pref.keybinds.previousChapter}
                        onChange={noop}
                        onKeyDown={changeKeybind}
                      />
                    </div>
                    <div styleName="flex fill gap-1">
                      <strong>Next chapter</strong>
                      <input
                        styleName="fill align-right"
                        name="nextChapter"
                        value={pref.keybinds.nextChapter}
                        onChange={noop}
                        onKeyDown={changeKeybind}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <nav styleName="pageNavigation">
        <button type="button" title={isReverse ? "Last Page" : "First Page"} onClick={isReverse ? last : first}>
          <BiChevronsLeft />
        </button>
        <button type="button" title={isReverse ? "Next Page" : "Previous Page"} onClick={isReverse ? next : prev}>
          <BiChevronLeft />
        </button>
        <div styleName="count">
          {currentPage && pages?.length && (
            <select defaultValue={currentPage.num} onChange={e => jump(Number(e.target.value))}>
              {pages.map(p => (
                <option value={p.num} key={p.num}>
                  {p.num}
                </option>
              ))}
            </select>
          )}
          {currentPage?.num || "?"}/{pages?.length || "?"}
        </div>
        <button type="button" title={isReverse ? "Previous Page" : "Next Page"} onClick={isReverse ? prev : next}>
          <BiChevronRight />
        </button>
        <button type="button" title={isReverse ? "First Page" : "Last Page"} onClick={isReverse ? first : last}>
          <BiChevronsRight />
        </button>
      </nav>
      <button
        styleName="toggle"
        type="button"
        onClick={() => pushPreference({ showSidebar: !showSidebar })}
        title={showSidebar ? "Hide sidebar" : "Show sidebar"}
      >
        {showSidebar
          ? (() => (sidebarPosition === SidebarPosition.Left ? <BiChevronLeft /> : <BiChevronRight />))()
          : (() => (sidebarPosition === SidebarPosition.Left ? <BiChevronRight /> : <BiChevronLeft />))()}
      </button>
    </div>
  );
};

export default memo(Sidebar);
