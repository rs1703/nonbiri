declare interface BrowseContext {
  mountedRef: Mutable<boolean>;

  isLoading: boolean;
  setIsLoading: Dispatcher<boolean>;

  data: BrowseData;
  setData: Dispatcher<BrowseData>;

  query: BrowseQuery;
  setQuery: Dispatcher<BrowseQuery>;
}
