import { formatQuery } from "./encoding";

export const isChapterEqual = (prev: Chapter, next: Chapter) => {
  if ((prev && !next) || (!prev && next)) {
    return false;
  }
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.volume === next.volume &&
    prev.chapter === next.chapter &&
    prev.language === next.language &&
    prev.hash === next.hash &&
    prev.externalURL === next.externalURL &&
    prev.history?.createdAt === next.history?.createdAt &&
    prev.history?.updatedAt === next.history?.updatedAt &&
    prev.history?.readed === next.history?.readed &&
    prev.history?.lastViewed === next.history?.lastViewed &&
    prev.pages?.length === next.pages?.length
  );
};

export const isMangaEqual = (prev: Manga, next: Manga) => {
  if ((prev && !next) || (!prev && next)) {
    return false;
  }
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.cover === next.cover &&
    prev.description === next.description &&
    prev.demographic === next.demographic &&
    prev.origin === next.origin &&
    prev.rating === next.rating &&
    prev.status === next.status &&
    prev.createdAt === next.createdAt &&
    prev.updatedAt === next.updatedAt &&
    prev.banner === next.banner &&
    prev.readedChapters === next.readedChapters &&
    prev.totalChapters === next.totalChapters &&
    prev.latestChapterAt === next.latestChapterAt &&
    prev.followed === next.followed &&
    prev.followState === next.followState &&
    prev.followedAt === next.followedAt
  );
};

export const isQueryEmpty = (query: BrowseQuery) => !formatQuery(query).length;
