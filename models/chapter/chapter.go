package chapter

import (
	"database/sql"
	"sort"
	"strconv"

	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/utils/logger"

	"nonbiri/models/entity"
	"nonbiri/models/history"

	"github.com/jmoiron/sqlx"
)

type Chapter struct {
	ID      string `json:"id"`
	MangaId string `json:"mangaId" db:"mangaId"`

	Metadata

	Pages   Pages            `json:"pages,omitempty"`
	History *history.History `json:"history,omitempty" db:"history"`

	MangaTitle string `json:"mangaTitle,omitempty" db:"mangaTitle"`
	Cover      string `json:"cover,omitempty"`
}

type Metadata struct {
	CreatedAt int64 `json:"createdAt,omitempty" db:"createdAt"`
	PublishAt int64 `json:"publishAt,omitempty" db:"publishAt"`
	UpdatedAt int64 `json:"updatedAt,omitempty" db:"updatedAt"`

	Title    string       `json:"title,omitempty"`
	Volume   string       `json:"volume,omitempty"`
	Chapter  string       `json:"chapter,omitempty"`
	Language Language     `json:"language,omitempty"`
	Groups   entity.Slice `json:"groups,omitempty"`

	Hash        string `json:"hash,omitempty"`
	ExternalURL string `json:"externalURL,omitempty" db:"externalURL"`
}

type Slice []*Chapter
type Map map[string]*Chapter

var count uint8

func All(limit uint16) (result Slice, err error) {
	q := `SELECT
					chapter.id,
					chapter.mangaId,
					chapter.createdAt,
					chapter.publishAt,
					chapter.title,
					chapter.volume,	
					chapter.chapter,
					chapter.groups,
					chapter.hash,
					chapter.externalURL,
					history.readed "history.readed",
					history.lastViewed "history.lastViewed",
					manga.title mangaTitle,
					manga.cover cover
				FROM (
					SELECT
						*,
						ROW_NUMBER() OVER (
							PARTITION BY mangaId
							ORDER BY publishAt DESC
						) n
					FROM chapter
				) chapter
				LEFT JOIN manga ON manga.id = chapter.mangaId
				LEFT JOIN history ON history.chapterId = chapter.id
				WHERE n <= 3 AND manga.followed = true ORDER BY chapter.publishAt DESC
				LIMIT ?`
	if err = DB.Select(&result, q, limit); err != nil {
		logger.Unexpected(err)
	}
	return
}

func One(id string) (result *Chapter, err error) {
	result = &Chapter{}
	if err = DB.Get(result, "SELECT * FROM chapter WHERE id = ?", id); err == nil {
		result.History, _ = history.ByChapter(result.ID)
	} else if err == sql.ErrNoRows {
		err = ErrChapterNotFound
	}
	return
}

func ByManga(id string) (result Slice) {
	DB.Select(&result, "SELECT * FROM chapter WHERE mangaId = ?", id)
	if len(result) == 0 {
		return
	}

	var cIds []string
	cMap := make(Map)

	for _, c := range result {
		cIds = append(cIds, c.ID)
		cMap[c.ID] = c
	}

	q, args, err := sqlx.In("SELECT * FROM history WHERE chapterId in (?)", cIds)
	if err != nil {
		return
	}

	rows, err := DB.Queryx(DB.Rebind(q), args...)
	if err != nil {
		if rows != nil {
			rows.Close()
		}
		return
	}
	defer rows.Close()

	for rows.Next() {
		h := &history.History{}
		if err = rows.StructScan(h); err != nil {
			continue
		}
		cMap[h.ChapterId].History = h
	}

	result.SortByChapter()
	return
}

func (c *Chapter) UpdateMetadata(tx *sqlx.Tx) (sql.Result, error) {
	return NamedExec(tx)(`
		INSERT OR IGNORE INTO chapter (id, mangaId)
		VALUES (:id, :mangaId);

		UPDATE 	chapter
		SET 		createdAt	= :createdAt,	publishAt 	= :publishAt,
						updatedAt	= :updatedAt, title 			= :title,
						volume		= :volume,		chapter 		= :chapter,
						language	= :language,	groups 			= :groups,
						hash			= :hash,			externalURL = :externalURL,
						pages			= :pages
		WHERE 	id				= :id`, c)
}

func (s Slice) Map() (result Map) {
	result = make(Map)
	for _, m := range s {
		result[m.ID] = m
	}
	return
}

func (s Slice) SortByLatest() {
	sort.SliceStable(s, func(i, j int) bool {
		if s[i].PublishAt == s[j].PublishAt {
			a, err := strconv.ParseFloat(s[i].Chapter, 32)
			if err != nil {
				return false
			}

			b, err := strconv.ParseFloat(s[j].Chapter, 32)
			if err != nil {
				return true
			}
			return a > b
		}
		return s[i].PublishAt > s[j].PublishAt
	})
}

func (s Slice) SortByChapter() {
	sort.SliceStable(s, func(i, j int) bool {
		a, err := strconv.ParseFloat(s[i].Chapter, 32)
		if err != nil {
			return false
		}

		b, err := strconv.ParseFloat(s[j].Chapter, 32)
		if err != nil {
			return true
		}

		if a == b {
			return s[i].PublishAt > s[j].PublishAt
		}
		return a > b
	})
}

func (s *Map) Slice() (result Slice) {
	for _, m := range *s {
		result = append(result, m)
	}
	return
}
