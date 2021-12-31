package history

import (
	"database/sql"
	"time"

	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/utils/logger"

	"nonbiri/models/entity"
	"nonbiri/utils/nullable"
)

type History struct {
	ID        uint64 `json:"id"`
	ChapterId string `json:"chapterId" db:"chapterId"`

	CreatedAt int64 `json:"createdAt,omitempty" db:"createdAt"`
	UpdatedAt int64 `json:"updatedAt,omitempty" db:"updatedAt"`

	Readed     nullable.Bool   `json:"readed"`
	LastViewed nullable.Uint16 `json:"lastViewed" db:"lastViewed"`

	MangaId    string `json:"mangaId,omitempty" db:"mangaId"`
	MangaTitle string `json:"mangaTitle,omitempty" db:"mangaTitle"`
	Cover      string `json:"cover,omitempty"`

	Title    string       `json:"title,omitempty"`
	Volume   string       `json:"volume,omitempty"`
	Chapter  string       `json:"chapter,omitempty"`
	Language Language     `json:"language,omitempty"`
	Groups   entity.Slice `json:"groups,omitempty"`

	N uint16 `json:"-" db:"n"`
}

type Slice []*History

var count uint8

func All(limit uint16) (result []*History) {
	q := `WITH result AS (
					SELECT 
						history.*, 
						chapter.mangaId mangaId,
						chapter.title title,
						chapter.volume volume,
						chapter.chapter chapter,
						chapter.groups groups,
						ROW_NUMBER() OVER (
							PARTITION BY chapter.mangaId
							ORDER BY CASE
								WHEN history.updatedAt > 0 THEN history.updatedAt
								ELSE history.createdAt
							END DESC
						) n
					FROM history
					LEFT JOIN chapter ON chapter.id = history.chapterId
					WHERE history.readed = true OR history.lastViewed > 0
				)

				SELECT result.*,	manga.title mangaTitle,	manga.cover cover
				FROM result LEFT JOIN manga ON manga.id = result.mangaId
				WHERE n <= 3
				ORDER BY CASE
					WHEN result.updatedAt > 0
						THEN result.updatedAt
					ELSE result.createdAt
				END DESC
				LIMIT ?`

	if err := DB.Select(&result, q, limit); err != nil {
		logger.Unexpected(err)
	}
	return
}

func One(id uint64) (result *History, err error) {
	q := `SELECT history.*, manga.id mangaId FROM history
				LEFT JOIN chapter ON chapter.id = history.chapterId
				LEFT JOIN manga ON manga.id = chapter.mangaId
				WHERE history.id = ?`

	result = &History{}
	if err = DB.Get(result, q, id); err == sql.ErrNoRows {
		err = ErrHistoryNotFound
	}
	return
}

func ByChapter(id string) (result *History, err error) {
	q := `SELECT history.*, manga.id mangaId FROM history
				LEFT JOIN chapter ON chapter.id = history.chapterId
				LEFT JOIN manga ON manga.id = chapter.mangaId
				WHERE history.chapterId = ?`

	result = &History{}
	if err = DB.Get(result, q, id); err == sql.ErrNoRows {
		err = ErrHistoryNotFound
	}
	return
}

func (h *History) Save() (err error) {
	h.CreatedAt = time.Now().Unix()

	q := `INSERT INTO history (chapterId, createdAt, updatedAt, readed, lastViewed)
				VALUES (:chapterId, :createdAt, :updatedAt, :readed, :lastViewed);`

	if _, err = DB.NamedExec(q, h); err != nil {
		return
	}

	q = `SELECT history.*, manga.id mangaId FROM history
				LEFT JOIN chapter ON chapter.id = history.chapterId
				LEFT JOIN manga ON manga.id = chapter.mangaId
				WHERE history.chapterId = ?`

	return DB.Get(h, q, h.ChapterId)
}

func (h *History) Update() (result sql.Result, err error) {
	h.UpdatedAt = time.Now().Unix()

	q := `UPDATE 	history
				SET			updatedAt 	= :updatedAt,
								readed 			= :readed,
								lastViewed 	= :lastViewed
				WHERE 	chapterId 	= :chapterId`

	return DB.NamedExec(q, h)
}
