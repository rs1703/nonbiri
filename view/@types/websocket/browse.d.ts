import { Demographic, Language, Order, Rating, Sort, Status } from "../../src/constants";

declare global {
  interface BrowseData {
    entries?: Manga[];
    query: BrowseQuery;
    limit?: number;
    offset?: number;
    total?: number;
  }

  interface BrowseQuery {
    limit?: number;
    offset?: number;
    title?: string;
    author?: string[];
    artist?: string[];
    year?: number;
    includedTag?: string[];
    excludedTag?: string[];
    status?: Status[];
    origin?: Language[];
    excludedOrigin?: Language[];
    availableLanguage?: Language[];
    demographic?: Demographic[];
    id?: string[];
    rating?: Rating[];
    sort?: Sort;
    order?: Order;

    search?: string;
  }
}
