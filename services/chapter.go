package services

import (
	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/prefs"
	"nonbiri/utils"

	"nonbiri/models/chapter"
	"nonbiri/scrapers/mangadex"
)

func GetChapter(id string) (_ *chapter.Chapter, err error) {
	defer utils.Track("services.GetChapter")()

	data, err := chapter.One(id)
	if err != nil {
		return
	}

	return data, nil
}

func UpdateChapter(id string) (_ *chapter.Chapter, err error) {
	defer utils.Track("services.UpdateChapter")()

	data, err := chapter.One(id)
	if err != nil {
		if err == ErrChapterNotFound {
			data = &chapter.Chapter{ID: id}
		} else {
			return
		}
	}

	newData, err := mangadex.GetChapterEx(id)
	if err != nil {
		return
	}

	data.MangaId = newData.MangaId
	if len(newData.Hash) == 0 {
		newData.Hash = data.Hash
	}
	data.Metadata = newData.Metadata
	if len(newData.Pages) > 0 {
		data.Pages = newData.Pages
	}

	if _, err = data.UpdateMetadata(nil); err != nil {
		return
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}

func GetChapters(mangaId string) ([]*chapter.Chapter, error) {
	defer utils.Track("services.GetChapters")()
	return chapter.ByManga(mangaId), nil
}

func UpdateChapters(mangaId string, isUpdating bool) (_ []*chapter.Chapter, err error) {
	defer utils.Track("services.UpdateChapters")()

	chapters := chapter.ByManga(mangaId)
	newChapters, err := mangadex.GetChaptersEx(mangaId, mangadex.FeedQuery{
		TranslatedLanguage: []string{prefs.Browse.Language.String()},
	})
	if err != nil {
		return
	}

	tx, err := DB.Beginx()
	if err != nil {
		return
	}

	cMap := chapters.Map()
	for _, next := range newChapters {
		if prev, exists := cMap[next.ID]; exists {
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
		return
	}

	cacheLibrary(isUpdating)
	cacheUpdates(isUpdating)
	return chapters, nil
}
