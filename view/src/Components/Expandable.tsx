import React, { useEffect, useRef, useState } from "react";
import { BiChevronsDown, BiChevronsUp } from "react-icons/bi";
import "../styles/Expandable.less";

interface ExpandableProps extends Props<HTMLDivElement> {
  maxHeight: number;
}

const Expandable = ({ children, maxHeight, ...props }: ExpandableProps) => {
  const ref = useRef<HTMLDivElement>();
  const contentRef = useRef<HTMLDivElement>();
  const expandButtonRef = useRef<HTMLButtonElement>();

  const [contentHeight, setContentHeight] = useState<number>();
  const [isLongContent, setIsLongContent] = useState<boolean>();
  const [isHidden, setIsHidden] = useState<boolean>();

  const frameRef = useRef(0);
  useEffect(() => {
    const calculateHeight = () => {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        setContentHeight(contentRef.current.clientHeight);
      });
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
    };
  }, [children]);

  useEffect(() => {
    if (contentHeight > maxHeight) {
      if (!isLongContent) {
        if (!isHidden) setIsHidden(true);
        setIsLongContent(true);
      }
    } else {
      if (isLongContent) setIsLongContent(false);
      if (isHidden) setIsHidden(false);
    }

    if (!isLongContent) {
      ref.current.style.height = "";
      return;
    }

    if (isHidden) {
      ref.current.style.height = `${maxHeight}px`;
    } else {
      ref.current.style.height = `${contentRef.current.clientHeight + (expandButtonRef.current?.clientHeight || 0)}px`;
    }
  }, [contentHeight, isHidden, isLongContent]);

  return (
    <div {...props} styleName="expandable" data-hidden={isHidden || undefined} ref={ref}>
      <div ref={contentRef}>{children}</div>
      {isLongContent && (
        <div styleName="expand">
          <div styleName="shadow" />
          <button type="button" onClick={() => setIsHidden(!isHidden)} ref={expandButtonRef}>
            {isHidden ? <BiChevronsDown /> : <BiChevronsUp />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Expandable;
