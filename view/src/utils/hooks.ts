// eslint-disable-next-line import/no-extraneous-dependencies
import { History } from "history";
import { DependencyList, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useHistory, useLocation } from "react-router";
import ReaderContext from "../Components/Reader/ReaderContext";

export const useMutableMemo = <T>(callbackfn: (prev?: T) => T, deps: DependencyList): Mutable<T> => {
  const ref = useRef<T>();

  useMemo(() => {
    ref.current = callbackfn(ref.current);
  }, deps);

  return ref;
};

export const useMutableLocation = <T>(): Mutable<T> => {
  const { state } = useLocation<T>();
  const ref = useRef<T>();

  useMemo(() => {
    ref.current = state;
  }, [state]);

  return ref;
};

export const useMutableHistory = <T>(): Mutable<History<T>> => {
  const history = useHistory<T>();
  const ref = useRef<History<T>>();

  useMemo(() => {
    ref.current = history;
  }, [history]);

  return ref;
};

export const useModal = <T extends HTMLElement>(ref: Mutable<T>, state: boolean, setState: Dispatcher<boolean>) => {
  useEffect(() => {
    const listener = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as HTMLElement)) {
        setState(false);
      }
    };
    if (ref.current) {
      document.addEventListener("click", listener);
    }
    return () => {
      document.removeEventListener("click", listener);
    };
  }, [state, setState, ref]);
};

export const useMounted = (): Mutable<boolean> => {
  const mountedRef = useRef<boolean>();
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
};

interface IntersectionObserverOptions extends IntersectionObserverInit {
  once?: boolean;
}

export const useIntersectionObserver = <T extends HTMLElement>(
  callbackfn: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverOptions
): Mutable<T> => {
  const ref = useRef<T>();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (options?.once) {
          if (entry.isIntersecting) {
            observer.disconnect();
          } else {
            return;
          }
        }
        callbackfn(entry);
      });
    }, options);
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [callbackfn, options]);
  return ref;
};

export const useNavigate = () => {
  const { pages, currentPage, setPages } = useContext(ReaderContext);

  const last = useCallback(() => {
    if (!pages?.length || currentPage.num === pages.length) {
      return;
    }
    const lastPage = pages[pages.length - 1];
    lastPage.ref.current?.scrollIntoView();
    setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === lastPage.num }))));
  }, [pages]);

  const prev = useCallback(() => {
    if (!pages?.length || currentPage.num === 1) {
      return;
    }
    currentPage.ref.current.previousElementSibling?.scrollIntoView();
    setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === currentPage.num - 1 }))));
  }, [pages]);

  const next = useCallback(() => {
    if (!pages?.length || currentPage.num === pages.length) {
      return;
    }
    currentPage.ref.current.nextElementSibling?.scrollIntoView();
    setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === currentPage.num + 1 }))));
  }, [pages]);

  const first = useCallback(() => {
    if (!pages?.length || currentPage.num === 1) {
      return;
    }
    const [firstPage] = pages;
    firstPage.ref.current?.scrollIntoView();
    setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === firstPage.num }))));
  }, [pages]);

  const jump = useCallback(
    (pageNum: number) => {
      if (!pages?.length || currentPage.num === pageNum) {
        return;
      }
      const page = pages[pageNum - 1];
      page.ref.current?.scrollIntoView();
      setPages(prevState => Array.from(prevState.map(x => ({ ...x, isViewing: x.num === page.num }))));
    },

    [pages]
  );

  return { last, prev, next, first, jump };
};

export const useKeydown = (callbackfn: (ev: KeyboardEvent) => void) => {
  useEffect(() => {
    window.addEventListener("keydown", callbackfn);
    return () => {
      window.removeEventListener("keydown", callbackfn);
    };
  }, [callbackfn]);
};

export const useOnResize = (callbackfn: (ev: UIEvent) => void) => {
  useEffect(() => {
    window.addEventListener("resize", callbackfn);
    return () => {
      window.removeEventListener("resize", callbackfn);
    };
  }, [callbackfn]);
};

export const useOnScroll = (callbackfn: (ev: Event) => void) => {
  useEffect(() => {
    window.addEventListener("scroll", callbackfn);
    return () => {
      window.removeEventListener("scroll", callbackfn);
    };
  }, [callbackfn]);
};
