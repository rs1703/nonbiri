import { Language } from "../src/constants";

declare global {
  interface Chapter extends ChapterMetadata {
    id: string;
    mangaId: string;

    pages?: string[];
    history?: ReadState;

    mangaTitle?: string;
    cover?: string;
  }

  interface ChapterMetadata {
    createdAt?: number;
    publishAt?: number;
    updatedAt?: number;

    title?: string;
    volume?: string;
    chapter?: string;
    language?: Language;
    groups?: Group[];

    hash?: string;
    externalURL?: string;
  }
}
