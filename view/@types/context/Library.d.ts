declare interface LibraryContext {
  mountedRef: Mutable<boolean>;

  data: Manga[];

  query: BrowseQuery;
  setQuery: Dispatcher<BrowseQuery>;
}
