declare interface ReaderContext {
  mountedRef: Mutable<boolean>;
  isTransitionRef: Mutable<boolean>;

  isLoading: boolean;
  setIsLoading: Dispatcher<boolean>;

  isUpdating: boolean;
  setIsUpdating: Dispatcher<boolean>;

  dataRef: Mutable<Manga>;
  chapterRef: Mutable<Chapter>;
  prevChapter: Chapter;
  nextChapter: Chapter;

  pages: PageState[];
  setPages: Dispatcher<PageState[]>;

  currentPage: PageState;
}

declare interface PageState {
  isViewing?: boolean;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  isFailed?: boolean;

  ref?: Mutable<HTMLDivElement>;
  num: number;
}
