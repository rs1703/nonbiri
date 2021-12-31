/* eslint-disable no-unreachable-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
export const loadImage = (src: string, mountedRef: Mutable<boolean>, maxRetries = 3): Promise<void> => {
  let retryCount = 0;
  return new Promise<void>((resolve, reject) => {
    const load = () => {
      if (!mountedRef.current || retryCount > maxRetries) {
        reject();
        return;
      }
      retryCount++;

      const img = document.createElement("img");
      img.src = src;

      if (img.complete) {
        resolve();
      } else {
        img.addEventListener("load", () => resolve());
        img.addEventListener("error", () => setTimeout(load, 3000));
      }
    };
    load();
  });
};

export const isLink = (v: string): boolean => {
  let url: URL;
  try {
    url = new URL(v);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

const Contains = (str: string, v: string) => str.toLowerCase().includes(v?.toLowerCase());

const Track = (label: string) => {
  console.time(label);
  console.info(label);
  return () => {
    console.timeEnd(label);
  };
};

const IsObjectEmpty = v => {
  for (const x in v) return false;
  return true;
};

const lastKey = (v: any) => {
  const keys = Object.keys(v);
  return keys[keys.length - 1];
};

export default {
  IsObjectEmpty,
  Contains,
  lastKey,
  Track
};
