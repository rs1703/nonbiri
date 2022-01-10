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

func UpdateManga(id string, isUpdating bool) (*manga.Manga, error) {
	defer logger.Track()()

	data, err := manga.One(id, false)
	if err != nil {
		if err == ErrMangaNotFound {
			data = &manga.Manga{ID: id}
		} else {
			return nil, err
		}
	}

	newData, err := mangadex.GetMangaEx(id)
	if err != nil {
		return nil, err
	}
	data.Metadata = newData.Metadata

	if len(data.Banner) <= 1 && len(data.Links.AniList) > 0 {
		banner, err := anilist.GetBanner(data.Links.AniList)
		if err == nil {
			data.Banner = banner
		} else {
			logger.Err.Println(data.ID, err)
		}
	}

	_, err = data.UpdateMetadata(nil)
	if err != nil {
		return nil, err
	}

	data.Chapters, err = UpdateChapters(data.ID, isUpdating)
	if err != nil {
		return nil, err
	}

	if len(data.Chapters) > 0 {
		data.Chapters.SortByLatest()
		data.LatestChapterAt = utils.NullableInt64(data.Chapters[0].PublishAt)
		data.Chapters.SortByChapter()
	}

	return data, nil
}

func FollowManga(id string, followState FollowState) (*manga.Manga, error) {
	defer logger.Track()()

	data, err := manga.One(id, true)
	if err != nil {
		return nil, err
	}

	data.Followed = true
	data.FollowState = followState
	if data.FollowedAt == 0 {
		data.FollowedAt = time.Now().Unix()
	}

	if _, err = data.UpdateFollowState(nil); err != nil {
		return nil, err
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}

func UnfollowManga(id string) (*manga.Manga, error) {
	defer logger.Track()()

	data, err := manga.One(id, true)
	if err != nil {
		return nil, err
	}

	data.Followed = false
	data.FollowState = FollowStates.None
	data.FollowedAt = 0

	if _, err = data.UpdateFollowState(nil); err != nil {
		return nil, err
	}

	cacheLibrary(false)
	cacheUpdates(false)
	return data, nil
}
