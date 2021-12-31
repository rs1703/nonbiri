import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Headroom from "react-headroom";
import { BiFilter, BiSort } from "react-icons/bi";
import { HiSortAscending, HiSortDescending } from "react-icons/hi";
import AppContext from "../AppContext";
import Config from "../Config";
import {
  DemographicKeys,
  DemographicValues,
  LanguageKeys,
  LanguageValues,
  Order,
  RatingKeys,
  RatingValues,
  Sort,
  StatusKeys,
  StatusValues
} from "../constants";
import "../styles/Header.less";
import { deepClone, formatQuery } from "../utils/encoding";
import { useModal } from "../utils/hooks";
import Anchor from "./Anchor";

interface SearchProps extends Props<HTMLFormElement> {
  isBrowse?: boolean;
  query?: BrowseQuery;
  setQuery?: Dispatcher<BrowseQuery>;
}

const params: [string, string[], string[], string[] | number[]][] = [
  ["Demographic", ["demographic"], DemographicKeys, DemographicValues],
  ["Origin", ["origin", "excludedOrigin"], LanguageKeys, LanguageValues],
  ["Rating", ["rating"], RatingKeys, RatingValues],
  ["Status", ["status"], StatusKeys, StatusValues]
];

const randPlaceholders = ["Villainess Level 99", "Koushaku Reijou", "Akasaka Aka"];
const placeholder = randPlaceholders[Math.floor(Math.random() * randPlaceholders.length)];

const Search = ({ isBrowse, query, setQuery, ...props }: SearchProps) => {
  const { tags } = useContext(AppContext).context;

  const ref = useRef<HTMLFormElement>();
  const inputRef = useRef<HTMLInputElement>();
  const queryRef = useRef<BrowseQuery>({});
  const [isActive, setIsActive] = useState<boolean>();

  const groups = useMemo<typeof params>(
    () => [...params, ["Tags", ["includedTag", "excludedTag"], tags.map(tag => tag.name), []]],
    [tags]
  );

  const onSubmit = useCallback(
    (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();

      queryRef.current[inputRef.current.name] = inputRef.current.value;
      if (formatQuery(queryRef.current) !== formatQuery(query)) {
        console.info(`[%s] Updating query...`, isBrowse ? "Browse" : "Library");
        setQuery(deepClone(queryRef.current));
      }
    },
    [isBrowse, query, setQuery]
  );

  const updateParams = useCallback((names: string[], input: HTMLInputElement) => {
    const { value } = input;
    const n = Number(value);

    if (!input.checked) {
      const isFirstName = input.name === names[0];
      if (isFirstName) {
        const idx = queryRef.current[names[0]]?.findIndex(v => v === n || v === value);
        if (idx >= 0) queryRef.current[names[0]].splice(idx, 1);
      }

      if (names.length === 2) {
        if (isFirstName) {
          input.checked = true;
          [, input.name] = names;
        } else {
          const idx = queryRef.current[names[1]]?.findIndex(v => v === n || v === value);
          if (idx >= 0) queryRef.current[names[1]].splice(idx, 1);

          [input.name] = names;
        }
      }
    }

    if (input.checked) {
      if (!queryRef.current[input.name]) {
        queryRef.current[input.name] = [];
      }
      queryRef.current[input.name].push(Number.isInteger(n) ? n : value);
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = query?.[inputRef.current.name] || "";
      setIsActive(false);
    }
    queryRef.current = deepClone(query);
  }, [query]);

  useModal(ref, isActive, setIsActive);

  return (
    <form {...props} styleName="search" onSubmit={onSubmit} ref={ref}>
      <input
        type="text"
        name={isBrowse ? "title" : "search"}
        placeholder={`Search by manga title or author/artist name, e.g., ${placeholder}`}
        defaultValue={(isBrowse ? query?.title : query?.search) || ""}
        autoComplete="off"
        ref={inputRef}
      />
      <div styleName="filter">
        <button type="button" title="Search filters" onClick={() => setIsActive(!isActive)}>
          <BiFilter />
        </button>
        {isActive && (
          <div styleName="pop">
            {groups.map(([title, names, keys, values]) => (
              <div styleName="section" key={title}>
                <strong>{title}</strong>
                <div styleName="sectionContent">
                  {(keys as string[]).map((k, i) => {
                    const v = values[i] || k;
                    const isIncluded = queryRef.current[names[0]]?.includes(v);
                    const isExcluded = queryRef.current[names[1]]?.includes(v);
                    return (
                      <label key={k}>
                        <input
                          type="checkbox"
                          data-included={isIncluded || undefined}
                          data-excluded={isExcluded || undefined}
                          name={isExcluded ? names[1] : names[0]}
                          value={v}
                          defaultChecked={isIncluded || isExcluded}
                          onChange={ev => updateParams(names, ev.target)}
                        />
                        <span>{k}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

interface SorterProps extends Props<HTMLDivElement> {
  options?: SortOptions;
  sort?: Sort;
  order?: Order;
  callback?: (v: Sort) => void;
}

const Sorter = ({ options, sort, order, callback, ...props }: SorterProps) => {
  const popRef = useRef<HTMLDivElement>();
  const [isActive, setIsActive] = useState<boolean>();

  useModal(popRef, isActive, setIsActive);

  return (
    <div {...props} styleName="sort">
      <button type="button" aria-label="Sort" title="Sort" onClick={() => setIsActive(!isActive)}>
        <BiSort />
      </button>
      {isActive && (
        <div styleName="pop" ref={popRef}>
          <strong>Sort</strong>
          <ul>
            {options.map(([text, val]) => (
              <li key={text}>
                <button type="button" onClick={() => callback(val)}>
                  {(() => {
                    if (sort === val) {
                      return order === Order.ASC ? <HiSortAscending /> : <HiSortDescending />;
                    }
                    return <span />;
                  })()}
                  <span>{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface HeaderProps extends Props<HTMLDivElement> {
  searchProps?: SearchProps;
  sorterProps?: SorterProps;
}

const Header = ({ searchProps, sorterProps, children, ...props }: HeaderProps) => (
  <Headroom>
    <div {...props} styleName="header">
      <div styleName="headerContent">
        <ul styleName="navigation">
          {Config.header.links.map(([text, p]) => (
            <li key={p}>
              <Anchor to={p}>
                <span>{text}</span>
              </Anchor>
            </li>
          ))}
        </ul>
        {searchProps && <Search {...searchProps} />}
        {sorterProps && (
          <div styleName="actions">
            <Sorter {...sorterProps} />
          </div>
        )}
        {children}
      </div>
    </div>
  </Headroom>
);

export default Header;
