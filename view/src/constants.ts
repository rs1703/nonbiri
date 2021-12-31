import { enumKeys, enumValues } from "./utils/encoding";

export enum Demographic {
  Josei = 1,
  Seinen,
  Shoujo,
  Shounen
}

export const DemographicKeys = enumKeys(Demographic);
export const DemographicValues = enumValues(Demographic);

export const Errors = {
  InvalidId: "invalid id",
  MangaNotFound: "manga does not exists",
  ChapterNotFound: "chapter does not exists",
  HistoryNotFound: "history does not exists",
  TagNotFound: "tag does not exists"
};

export enum FollowState {
  None,
  Reading,
  Planning,
  Completed,
  Dropped
}

export const FollowStateKeys = enumKeys(FollowState);
export const FollowStateValues = enumValues(FollowState);

export enum Language {
  English = 1,
  Japan,
  Chinese,
  Korea
}

export const LanguageKeys = enumKeys(Language);
export const LanguageValues = enumValues(Language);

export enum Rating {
  Safe = 1,
  Suggestive,
  Erotica,
  Pornographic
}

export const RatingKeys = enumKeys(Rating);
export const RatingValues = enumValues(Rating);

export enum Sort {
  Title = 1,
  Chapters,
  CreatedAt,
  UpdatedAt,
  PublishAt,
  LatestUploadedChapter,
  FollowedCount,
  Relevance,
  Volume,
  Chapter,

  UnreadedChapters = 20
}

declare global {
  type SortOptions = [string, Sort][];
}

export const SortKeys = enumKeys(Sort);
export const SortValues = enumValues(Sort);

export enum Order {
  ASC = 1,
  DESC
}

export const OrderKeys = enumKeys(Order);
export const OrderValues = enumValues(Order);

export enum Status {
  Ongoing = 1,
  Completed,
  Cancelled,
  Hiatus
}

export const StatusKeys = enumKeys(Status);
export const StatusValues = enumValues(Status);

export enum Task {
  GetManga = 1,
  UpdateManga,
  FollowManga,
  UnfollowManga,

  GetChapter,
  UpdateChapter,
  GetChapters,
  UpdateChapters,

  ReadPage,
  ReadChapter,
  UnreadChapter,

  Library = 30,
  Browse,
  Tags,
  Updates,
  History,

  GetPrefs = 40,
  GetBrowsePreference,
  GetLibraryPreference,
  GetReaderPreference,

  UpdateBrowsePreference = 51,
  UpdateLibraryPreference,
  UpdateReaderPreference
}

export enum PageDirection {
  TopToBottom = 1,
  RightToLeft,
  LeftToRight
}

export enum PageScale {
  Default,
  Original,
  Width,
  Height,
  Stretch,
  FitWidth,
  FitHeight,
  StretchWidth,
  StretchHeight
}

export enum SidebarPosition {
  Left = 1,
  Right
}

export const SidebarPositionKeys = enumKeys(SidebarPosition);
export const SidebarPositionValues = enumValues(SidebarPosition);
