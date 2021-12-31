import React, { memo, useEffect, useRef, useState } from "react";
import { IoWarning } from "react-icons/io5";
import "../styles/Picture.less";
import { loadImage } from "../utils";
import { useMounted } from "../utils/hooks";

interface PictureProps extends Props<HTMLImageElement | HTMLDivElement> {
  src: string;
  div?: boolean;
  failedMessage?: string;

  onSuccess?(ref: HTMLDivElement | HTMLImageElement): void;
  onFailed?(ref: HTMLDivElement | HTMLImageElement): void;
}

const Picture = ({ src, div, failedMessage, onSuccess, onFailed, ...props }: PictureProps) => {
  const ref = useRef<HTMLDivElement | HTMLImageElement>();
  const mountedRef = useMounted();

  const [isLoaded, setIsLoaded] = useState<boolean>();
  const [isFailed, setIsFailed] = useState<boolean>();

  useEffect(() => {
    const loader = loadImage(src, mountedRef);
    loader.then(() => {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setIsLoaded(true);

        if (onSuccess) {
          if (ref.current instanceof HTMLImageElement && !ref.current.complete) {
            ref.current.addEventListener("load", () => onSuccess(ref.current));
          } else {
            setTimeout(() => onSuccess(ref.current), 0);
          }
        }
      }, 0);
    });
    loader.catch(() => {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setIsFailed(true);

        if (onFailed) {
          setTimeout(() => onFailed(ref.current), 0);
        }
      }, 0);
    });
  }, []);

  return (
    <div styleName="picture">
      {(() => {
        if (isFailed) {
          return (
            <div styleName="error">
              <IoWarning />
              <span>{failedMessage || "Failed to load image"}</span>
            </div>
          );
        }
        return div ? (
          <div
            {...props}
            styleName="img"
            data-loading={!isLoaded || undefined}
            style={isLoaded ? { backgroundImage: `url("${src}")` } : undefined}
            ref={ref}
          />
        ) : (
          <img
            {...props}
            styleName="img"
            data-loading={!isLoaded || undefined}
            src={isLoaded ? src : undefined}
            ref={ref as any}
          />
        );
      })()}
    </div>
  );
};

export default memo(Picture);
