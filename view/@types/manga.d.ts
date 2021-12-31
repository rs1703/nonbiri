import { Demographic, FollowState, Language, Rating, Status } from "../src/constants";

declare global {
  interface Manga extends MangaMetadata {
    id: string;

    chapters?: Chapter[];
    banner?: string;

    totalChapters?: number;
    latestChapterAt?: number;
    readedChapters?: number;

    followed?: boolean;
    followState?: FollowState;
    followedAt?: number;
  }

  interface MangaMetadata {
    createdAt?: number;
    updatedAt?: number;

    title: string;
    description?: string;
    cover: string;

    authors?: Entity[];
    artists?: Entity[];
    tags?: string[];
    links?: Links;
    relateds?: Related[];

    demographic?: Demographic;
    origin?: Language;
    rating?: Rating;
    status?: Status;
  }

  interface Related {
    id: string;
    title: string;
    type: string;
  }

  interface Links {
    al?: string; // AniList
    ap?: string; // AnimePlanet
    bw?: string; // MangaWalker
    mu?: string; // MangaUpdates
    nu?: string; // NovelUpdates
    kt?: string; // Kitsu
    amz?: string; // Amazon
    ebj?: string; // EmangaJapan
    mal?: string; // MyAnimeList
    raw?: string;
    engtl?: string;
  }
}
