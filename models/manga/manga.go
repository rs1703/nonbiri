package manga

import (
	"database/sql"

	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/utils"

	"nonbiri/models/chapter"
	"nonbiri/models/entity"

	"github.com/jmoiron/sqlx"
	"github.com/rs1703/logger"
)

type Manga struct {
	ID string `json:"id"`

	Metadata

	Chapters chapter.Slice `json:"chapters,omitempty"`
	Banner   string        `json:"banner,omitempty"`

	TotalChapters   uint16              `json:"totalChapters" db:"totalChapters"`
	LatestChapterAt utils.NullableInt64 `json:"latestChapterAt" db:"latestChapterAt"`
	ReadedChapters  uint16              `json:"readedChapters" db:"readedChapters"`

	Followed    bool        `json:"followed"`
	FollowState FollowState `json:"followState" db:"followState"`
	FollowedAt  int64       `json:"followedAt" db:"followedAt"`
}

type Metadata struct {
	CreatedAt int64 `json:"createdAt,omitempty" db:"createdAt"`
	UpdatedAt int64 `json:"updatedAt,omitempty" db:"updatedAt"`

	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Cover       string `json:"cover"`

	Authors  entity.Slice `json:"authors,omitempty"`  // []*Entity
	Artists  entity.Slice `json:"artists,omitempty"`  // []*Entity
	Tags     Tags         `json:"tags,omitempty"`     // []string
	Links    Links        `json:"links,omitempty"`    // Links
	Relateds Relateds     `json:"relateds,omitempty"` // []*Related

	Demographic Demographic `json:"demographic,omitempty"`
	Origin      Language    `json:"origin,omitempty"`
	Rating      Rating      `json:"rating,omitempty"`
	Status      Status      `json:"status,omitempty"`
}

type Slice []*Manga
type Map map[string]*Manga

var count uint8

func All() (result Slice) {
	q := `SELECT manga.*,	COUNT(chapter.id) totalChapters, COUNT(history.id) readedChapters, MAX(chapter.publishAt) latestChapterAt FROM manga
				LEFT JOIN chapter ON chapter.mangaId = manga.id
				LEFT JOIN history ON history.chapterId = chapter.id AND history.readed = true
				GROUP BY manga.id	ORDER BY latestChapterAt DESC`

	if err := DB.Select(&result, q); err != nil {
		logger.Err.Println(err)
	}
	return
}

func Follows() (result Slice) {
	q := `SELECT manga.*,	COUNT(chapter.id) totalChapters, COUNT(history.id) readedChapters, MAX(chapter.publishAt) latestChapterAt FROM manga
				LEFT JOIN chapter ON chapter.mangaId = manga.id
				LEFT JOIN history ON history.chapterId = chapter.id AND history.readed = true
				WHERE manga.followed = true GROUP BY manga.id ORDER BY latestChapterAt DESC`

	if err := DB.Select(&result, q); err != nil {
		logger.Err.Println(err)
	}
	return
}

func One(id string, getChapters bool) (result *Manga, err error) {
	if err = DB.Get(&count, `SELECT 1 FROM manga WHERE id = ?`, id); err != nil {
		if err == sql.ErrNoRows {
			err = ErrMangaNotFound
		}
		return
	}

	q := `SELECT manga.*, COUNT(chapter.id) totalChapters, COUNT(history.id) readedChapters, MAX(chapter.publishAt) latestChapterAt FROM manga
				LEFT JOIN chapter ON chapter.mangaId = manga.id
				LEFT JOIN history ON history.chapterId = chapter.id AND history.readed = true
				WHERE manga.id = ?`

	result = &Manga{}
	if err = DB.Get(result, q, id); err == nil && getChapters {
		result.Chapters = chapter.ByManga(result.ID)
	}
	return
}

func ByChapter(id string, getChapters bool) (result *Manga, err error) {
	q := `SELECT manga.*, COUNT(c.ID) totalChapters, COUNT(history.id) readedChapters, MAX(c.publishAt) latestChapterAt FROM chapter
				LEFT JOIN manga ON manga.id = chapter.mangaId
				LEFT JOIN chapter c ON c.mangaId = chapter.mangaId
				LEFT JOIN history ON history.chapterId = c.id AND history.readed = true
				WHERE chapter.id = ?`

	result = &Manga{}
	if err = DB.Get(result, q, id); err != nil {
		if err == sql.ErrNoRows {
			err = ErrMangaNotFound
		}
	} else if getChapters {
		result.Chapters = chapter.ByManga(result.ID)
	}
	return
}

func (m *Manga) UpdateMetadata(tx *sqlx.Tx) (sql.Result, error) {
	q := `INSERT OR IGNORE INTO manga (id, title, cover)
				VALUES (:id, :title, :cover);
				
				UPDATE 	manga
				SET 		createdAt 	= :createdAt, 	updatedAt 	= :updatedAt,
								title 			= :title, 			description = :description,
								cover 			= :cover, 			authors 		= :authors,
								artists 		= :artists, 		tags 				= :tags,
								links 			= :links, 			relateds 		= :relateds,
								demographic = :demographic, origin 			= :origin,
								rating 			= :rating, 			status 			= :status,
								banner 			= :banner
				WHERE 	id 					= :id`

	return NamedExec(tx)(q, m)
}

func (m *Manga) UpdateFollowState(tx *sqlx.Tx) (sql.Result, error) {
	q := `UPDATE 	manga
				SET			followed 		= :followed,
								followState = :followState,
								followedAt 	= :followedAt
				WHERE 	id 					= :id`

	return NamedExec(tx)(q, m)
}

func (s Slice) Map() (result Map) {
	result = make(Map)
	for _, m := range s {
		result[m.ID] = m
	}
	return
}

func (s Map) Slice() (result Slice) {
	for _, m := range s {
		result = append(result, m)
	}
	return
}

func (s Map) GetIds() (result []string) {
	for id := range s {
		result = append(result, id)
	}
	return
}
