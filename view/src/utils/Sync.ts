const History = (chapters: Chapter[], history: ReadState) => {
  if (!chapters) return chapters;
  const chapter = chapters.find(c => c.id === history.chapterId);
  if (chapter) {
    Object.assign((chapter.history ??= {} as ReadState), history);
  }
  return chapters;
};

const All = (target: Manga[], source: Manga[]): Manga[] => {
  const entries = (target ??= []);
  if (source?.length) {
    for (let i = 0; i < source?.length; i++) {
      const data = entries.find(m => m.id === source[i].id);
      if (data) {
        Object.assign(data, source[i]);
      } else {
        entries.push(source[i]);
      }
    }
  }
  return entries;
};

export default {
  History,
  All
};
