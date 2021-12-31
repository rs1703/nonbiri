import { Language, Order, PageDirection, PageScale, Rating, SidebarPosition, Sort } from "../src/constants";

declare global {
  interface Prefs {
    browse: BrowsePreference;
    library: LibraryPreference;
    reader: ReaderPreference;
  }

  interface BrowsePreference {
    language: Language;
    origins: Language[];
    excludedTags: string[];
    ratings: Rating[];
  }

  interface LibraryPreference {
    sort: Sort;
    order: Order;
  }

  interface ReaderPreference {
    showSidebar: boolean;
    sidebarPosition: SidebarPosition;

    navigateOnClick: boolean;
    direction: PageDirection;
    scale: PageScale;
    maxWidth: string;
    maxHeight: string;
    gaps: string;
    zoom: string;

    maxPreloads: number;
    maxParallel: number;

    keybinds: Keybinds;
    keyScrollSpeed: string;
  }

  interface Keybinds {
    previousChapter: string;
    nextChapter: string;
    previousPage: string;
    nextPage: string;
  }
}
