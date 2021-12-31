CREATE TABLE IF NOT EXISTS manga (
  id VARCHAR(36) PRIMARY KEY,

  createdAt INT DEFAULT 0,
  updatedAt INT DEFAULT 0,

  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT "",
  cover VARCHAR(255) NOT NULL,
  banner VARCHAR(255) DEFAULT "",

  authors BLOB DEFAULT "[]",
  artists BLOB DEFAULT "[]",
  tags BLOB DEFAULT "[]",
  links BLOB DEFAULT "{}",
  relateds BLOB DEFAULT "[]",

  demographic INT DEFAULT 0,
  origin INT DEFAULT 0,
  rating INT DEFAULT 0,
  status INT DEFAULT 0,

  followed BOOLEAN DEFAULT 0,
  followState INT DEFAULT 0,
  followedAt INT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS manga_id_idx ON manga(id);
CREATE INDEX IF NOT EXISTS manga_followed_idx ON manga(followed);

CREATE TABLE IF NOT EXISTS chapter (
  id VARCHAR(36) PRIMARY KEY,
  mangaId VARCHAR(36) NOT NULL REFERENCES manga(id) ON DELETE CASCADE,

  createdAt INT DEFAULT 0,
  publishAt INT DEFAULT 0,
  updatedAt INT DEFAULT 0,

  title VARCHAR(255) DEFAULT "",
  volume VARCHAR(255) DEFAULT "",
  chapter VARCHAR(255) DEFAULT "",
  language INT,
  groups BLOB DEFAULT "[]",

  hash VARCHAR(36) DEFAULT "",
  externalURL VARCHAR(255) DEFAULT "",
  pages BLOB DEFAULT "[]"
);

CREATE UNIQUE INDEX IF NOT EXISTS chapter_id_idx ON chapter(id);
CREATE INDEX IF NOT EXISTS chapter_mangaId_idx ON chapter(mangaId);
CREATE INDEX IF NOT EXISTS chapter_publishAt_idx ON chapter(publishAt);
CREATE INDEX IF NOT EXISTS chapter_mangaId_publishAt_idx ON chapter(mangaId,publishAt);

CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapterId VARCHAR(36) NOT NULL REFERENCES chapter(id) ON DELETE CASCADE,
  
  createdAt INT DEFAULT 0,
  updatedAt INT DEFAULT 0,

  readed BOOLEAN DEFAULT 0,
  lastViewed INT DEFAULT 0
);


CREATE INDEX IF NOT EXISTS history_chapterId_idx ON history(chapterId);
CREATE INDEX IF NOT EXISTS history_readed_idx ON history(readed);
CREATE INDEX IF NOT EXISTS history_lastViewed_idx ON history(lastViewed);
CREATE INDEX IF NOT EXISTS history_chapterId_readed_idx ON history(chapterId, readed);
CREATE INDEX IF NOT EXISTS history_readed_lastViewed_idx ON history(readed,lastViewed);

CREATE TABLE IF NOT EXISTS tag (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS tag_id_idx ON tag (id);
CREATE UNIQUE INDEX IF NOT EXISTS tag_name_idx ON tag (name);