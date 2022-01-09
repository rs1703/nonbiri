package services

import (
	"time"

	. "nonbiri/constants"
	"nonbiri/utils"

	"nonbiri/models/manga"
	"nonbiri/scrapers/anilist"
	"nonbiri/scrapers/mangadex"

	"github.com/rs1703/logger"
)

func GetManga(id string) (*manga.Manga, error) {
	defer logger.Track()()

	data, err := manga.One(id, true)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func UpdateManga(id string, isUpdating bool) (_ *manga.Manga, err error) {
	defer logger.Track()()

	data, err := manga.One(id, false)
	if err != nil {
		if err == ErrMangaNotFound {
			data = &manga.Manga{ID: id}
		} else {
			return
		}
	}

	newData, err := mangadex.GetMangaEx(id)
	if err != nil {
		return
	}
	data.Metadata = newData.Metadata

	if len(data.Banner) <= 1 && len(data.Links.AniList) > 0 {
		data.Banner, err = anilist.GetBanner(data.Links.AniList)
		if err != nil {
			return
		}
	}

	_, err = data.UpdateMetadata(nil)
	if err != nil {
		return
	}

	data.Chapters, err = UpdateChapters(data.ID, isUpdating)
	if err != nil {
		return
	}

	if len(data.Chapters) > 0 {
		data.Chapters.SortByLatest()
		data.LatestChapterAt = utils.NullableInt64(data.Chapters[0].PublishAt)
		data.Chapters.SortByChapter()
	}

	return data, nil
}

func FollowManga(id string, followState FollowState) (_ *manga.Manga, err error) {
	defer logger.Track()()

	data, err := manga.One(id, true)
	if err != nil {
		return
	}

	data.Followed = true
	data.FollowState = followState
	if data.FollowedAt == 0 {
		data.FollowedAt = time.Now().Unix()
	}

	if _, err = data.UpdateFollowState(nil); err != nil {
		return
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}

func UnfollowManga(id string) (_ *manga.Manga, err error) {
	defer logger.Track()()

	data, err := manga.One(id, true)
	if err != nil {
		return
	}

	data.Followed = false
	data.FollowState = FollowStates.None
	data.FollowedAt = 0

	if _, err = data.UpdateFollowState(nil); err != nil {
		return
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}
