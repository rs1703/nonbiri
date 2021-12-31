declare interface MangaContext {
  mountedRef: Mutable<boolean>;

  isLoading: boolean;
  setIsLoading: Dispatcher<boolean>;

  isUpdating: boolean;
  setIsUpdating: Dispatcher<boolean>;

  dataRef: Mutable<Manga>;
}
