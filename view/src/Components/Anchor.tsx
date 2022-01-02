import React, { forwardRef, useCallback, useMemo } from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import { useMutableHistory } from "../utils/hooks";

const Anchor = ({ to, onClick, ...props }: NavLinkProps & Props<HTMLAnchorElement>, ref) => {
  const historyRef = useMutableHistory();

  const toOverride = useMemo(() => {
    const context: any = typeof to === "string" || typeof to === "undefined" ? { pathname: to } : to;
    return {
      ...context,
      state: {
        ...(context.state || {}),
        from: historyRef.current.location.pathname
      }
    };
  }, [to]);

  const onClickOverride = useCallback(
    (ev: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(ev);
      if (ev.isDefaultPrevented()) return;
      if (!toOverride.pathname) {
        ev.preventDefault();
        return;
      }

      if (toOverride.pathname === historyRef.current.location.pathname) {
        if (!historyRef.current.location.search) {
          ev.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (!ev.altKey && !ev.ctrlKey && !ev.shiftKey) {
        window.scrollTo(0, 0);
      }
    },
    [onClick, toOverride.pathname]
  );

  return to ? (
    <NavLink activeClassName="active" to={toOverride} onClick={onClickOverride} ref={ref} {...props} />
  ) : (
    <span {...props} />
  );
};

export default forwardRef(Anchor);
