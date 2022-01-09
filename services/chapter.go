package services

import (
	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/prefs"

	"nonbiri/models/chapter"
	"nonbiri/scrapers/mangadex"

	"github.com/rs1703/logger"
)

func GetChapter(id string) (*chapter.Chapter, error) {
	defer logger.Track()()

	data, err := chapter.One(id)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func UpdateChapter(id string) (*chapter.Chapter, error) {
	defer logger.Track()()

	data, err := chapter.One(id)
	if err != nil {
		if err == ErrChapterNotFound {
			data = &chapter.Chapter{ID: id}
		} else {
			return nil, err
		}
	}

	newData, err := mangadex.GetChapterEx(id)
	if err != nil {
		return nil, err
	}

	data.MangaId = newData.MangaId
	data.Metadata = newData.Metadata
	if len(newData.Pages) > 0 {
		data.Pages = newData.Pages
	}

	if _, err = data.UpdateMetadata(nil); err != nil {
		return nil, err
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}

func GetChapters(mangaId string) ([]*chapter.Chapter, error) {
	defer logger.Track()()
	return chapter.ByManga(mangaId), nil
}

func UpdateChapters(mangaId string, isUpdating bool) ([]*chapter.Chapter, error) {
	defer logger.Track()()

	chapters := chapter.ByManga(mangaId)
	newChapters, err := mangadex.GetChaptersEx(mangaId, mangadex.FeedQuery{
		TranslatedLanguage: []string{prefs.Browse.Language.String()},
	})
	if err != nil {
		return nil, err
	}

	tx, err := DB.Beginx()
	if err != nil {
		return nil, err
	}

	cMap := chapters.Map()
	for _, next := range newChapters {
		if prev, exists := cMap[next.ID]; exists {
			if len(next.Hash) == 0 {
				next.Hash = prev.Hash
			}
			prev.Metadata = next.Metadata
			if len(next.Pages) > 0 {
				prev.Pages = next.Pages
			}
			*next = *prev
		} else {
			chapters = append(chapters, next)
		}

		next.UpdateMetadata(tx)
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	cacheLibrary(isUpdating)
	cacheUpdates(isUpdating)
	return chapters, nil
}
