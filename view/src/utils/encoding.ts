export const deepClone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const formatDate = (v: number) => {
  const time = new Date(v * 1000);
  const month = (time.getMonth() + 1).toString().padStart(2, "0");
  const date = time.getDate().toString().padStart(2, "0");
  const year = time.getFullYear().toString().slice(-2);
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  return `${month}/${date}/${year} ${hours}:${minutes}`;
};

export const formatGroups = (groups: Group[]) => {
  const names = groups?.map(g => g.name);
  const lastGroupName = names?.pop();
  return names?.length ? `${names.join(", ")} & ${lastGroupName}` : lastGroupName || "No Group";
};

export const formatChapter = (chapter: Chapter, includeTitle = true) => {
  if (!chapter) {
    return undefined;
  }

  if (chapter.title === "Oneshot") {
    return chapter.title;
  }

  const arr: string[] = [];

  if (chapter.volume) {
    arr.push(`Vol. ${chapter.volume}`);
  }

  if (chapter.chapter) {
    arr.push(`Ch. ${chapter.chapter}`);
  }

  if (chapter.title && includeTitle) {
    arr.push(`- ${chapter.title}`);
  }

  return arr.join(" ") || "Ch. 0";
};

export const formatQuery = (query: BrowseQuery): string => {
  const searchParams = new URLSearchParams();
  Object.keys(query || {}).forEach(k => {
    const v = query[k];
    if (v === undefined) return;
    if (Array.isArray(v)) {
      v.forEach(item => {
        if (item.toString().length) {
          searchParams.append(k, item);
        }
      });
    } else if (v.toString().length) {
      searchParams.append(k, v);
    }
  });

  const str = searchParams.toString();
  return str ? decodeURIComponent(`?${str}`) : "";
};

export const formatCoverURL = (data: Manga) => {
  if (!data || !data.id || !data.cover) return "";
  return data ? `/0/covers/${data.id}/${data.cover}` : undefined;
};

export const formatThumbnailURL = (data: Manga) => {
  if (!data || !data.id || !data.cover) return "";
  return data ? `/0/covers/${data.id}/${data.cover}.256.jpg` : undefined;
};

export const formatPageURL = (chapterHash: string, fileHash: string) => {
  if (!chapterHash || !fileHash) return "";
  return `/0/data/${chapterHash}/${fileHash}`;
};

const queryArrayFields = [
  "author",
  "artist",
  "includedTag",
  "excludedTag",
  "status",
  "origin",
  "excludedOrigin",
  "availableLanguage",
  "demographic",
  "id",
  "rating"
];

export const parseQuery = (searchParams: string | URLSearchParams): BrowseQuery => {
  if (!(searchParams instanceof URLSearchParams)) {
    // eslint-disable-next-line no-param-reassign
    searchParams = new URLSearchParams(searchParams);
  }

  const query = {} as BrowseQuery;
  searchParams.forEach((v, k) => {
    const n = Number(v);
    if (queryArrayFields.includes(k)) {
      if (!Array.isArray(query[k])) query[k] = [];
      query[k].push(Number.isInteger(n) ? n : v);
    } else {
      query[k] = Number.isInteger(n) ? n : v;
    }
  });

  return query;
};

export const enumKeys = v => Object.keys(v).filter(k => Number.isNaN(Number(k)));

export const enumValues = v =>
  Object.values(v)
    .map(x => Number(x))
    .filter(x => !Number.isNaN(x));
