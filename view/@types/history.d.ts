import { Language } from "../src/constants";

declare global {
  interface ReadState {
    id: number;
    chapterId: string;

    createdAt?: number;
    updatedAt?: number;

    readed?: boolean;
    lastViewed?: number;

    banner?: string;
    mangaId?: string;
    mangaTitle?: string;
    cover?: string;

    chapterTitle?: string;
    volume?: string;
    chapter?: string;
    language?: Language;
    groups: Group[];
  }
}
