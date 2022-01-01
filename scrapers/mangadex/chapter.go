package mangadex

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strconv"

	. "nonbiri/constants"
	"nonbiri/utils"

	"nonbiri/models/chapter"
	"nonbiri/utils/query"
)

// https://api.mangadex.org/docs.html#operation/get-manga-id-feed
type FeedQuery struct {
	Limit                    int      `define:"limit,omitempty" min:"1" max:"100" default:"100"`
	Offset                   int      `define:"offset,omitempty"`
	TranslatedLanguage       []string `define:"translatedLanguage[]" enum:"en,zh,ja,ko" default:"en"`
	OriginalLanguage         []string `define:"originalLanguage[]" enum:"en,zh,ja,ko" default:"jp"`
	ExcludedOriginalLanguage []string `define:"excludedOriginalLanguage[]" enum:"en,zh,ja,ko"`
	ContentRating            []string `define:"contentRating[]" enum:"safe,suggestive,erotica,pornographic" default:"safe,suggestive,erotica"`
	IncludeFutureUpdates     int      `define:"includeFutureUpdates" enum:"0,1" default:"1"`

	// format: YYYY-MM-DDTHH:MM:SS
	CreatedAtSince string `define:"createdAtSince"`
	UpdatedAtSince string `define:"updatedAtSince"`
	PublishAtSince string `define:"publishAtSince"`

	Sort     FeedSort `define:"order[$],map" default:"chapter,desc"`
	Includes []string `define:"includes[]" default:"scanlation_group"`
}

type FeedSort struct {
	By    string `enum:"createdAt,updatedAt,publishAt,volume,chapter"`
	Order string `enum:"asc,desc"`
}

// https://api.mangadex.org/docs.html#operation/get-chapter
type ChapterQuery struct {
	Limit                    int      `define:"limit,omitempty" min:"1" max:"100" default:"100"`
	Offset                   int      `define:"offset,omitempty"`
	Ids                      []string `define:"ids[]" max:"100"`
	Title                    string   `define:"title"`
	Groups                   []string `define:"groups[]"`
	Uploader                 string   `define:"title"`
	Manga                    string   `define:"manga"`
	Volume                   []string `define:"volume[]"`
	Chapter                  []string `define:"chapter[]"`
	TranslatedLanguage       []string `define:"translatedLanguage[]" enum:"en,zh,ja,ko" default:"en"`
	OriginalLanguage         []string `define:"originalLanguage[]" enum:"en,zh,ja,ko" default:"jp"`
	ExcludedOriginalLanguage []string `define:"excludedOriginalLanguage[]" enum:"en,zh,ja,ko"`
	ContentRating            []string `define:"contentRating[]" enum:"safe,suggestive,erotica,pornographic" default:"safe,suggestive,erotica"`
	IncludeFutureUpdates     int      `define:"includeFutureUpdates" enum:"0,1" default:"1"`

	// format: YYYY-MM-DDTHH:MM:SS
	CreatedAtSince string `define:"createdAtSince"`
	UpdatedAtSince string `define:"updatedAtSince"`
	PublishAtSince string `define:"publishAtSince"`

	Sort     ChapterSort `define:"order[$],map" default:"chapter,desc"`
	Includes []string    `define:"includes[]" default:"scanlation_group,user"`
}

type ChapterSort struct {
	By    string `enum:"createdAt,updatedAt,publishAt,volume,chapter"`
	Order string `enum:"asc,desc"`
}

func (o *ChapterQuery) buildURL() string {
	return buildURL("chapter", query.Parse(o))
}

// GetChapter retrieves chapter data
func GetChapter(id string) (*Chapter, error) {
	if err := validateId(id); err != nil {
		return nil, err
	}
	_ = limiter.Wait(context.Background())

	q := &url.Values{}
	q.Add("includes[]", "scanlation_group")

	url := buildURL(path.Join("chapter", id), q)
	buf, err := get(url)
	if err != nil {
		return nil, err
	}

	res := &Response[*Chapter]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		if res.Errors[0].Status == http.StatusNotFound {
			return nil, ErrChapterNotFound
		} else {
			return nil, errors.New(res.Errors[0].Detail)
		}
	}

	if len(res.Data.Attributes.Hash) == 0 || len(res.Data.Attributes.Data) == 0 {
		pagesMetadata, err := GetPages(id)
		if err != nil {
			return nil, err
		}
		res.Data.Attributes.Hash = pagesMetadata.Chapter.Hash
		res.Data.Attributes.Data = pagesMetadata.Chapter.Data
	}
	return res.Data, nil
}

// GetChapterEx retrieves chapter data
//  - This function returns normalized data
func GetChapterEx(id string) (*chapter.Chapter, error) {
	data, err := GetChapter(id)
	if err != nil {
		return nil, err
	}
	return data.Normalize(), err
}

// GetChapters retrieves all chapters of specified manga
func GetChapters(mangaId string, q FeedQuery) ([]*Chapter, error) {
	if err := validateId(mangaId); err != nil {
		return nil, err
	}

	queries := query.Parse(q)
	var entries []*Chapter

	for {
		_ = limiter.Wait(context.Background())

		url := buildURL(fmt.Sprintf("manga/%s/feed", mangaId), queries)
		buf, err := get(url)
		if err != nil {
			return nil, err
		}

		res := &Response[[]*Chapter]{}
		if err := utils.Unmarshal(buf, res); err != nil {
			return nil, err
		}

		for _, entry := range res.Data {
			if len(entry.Attributes.Hash) == 0 || len(entry.Attributes.Data) == 0 {
				pagesMetadata, err := GetPages(entry.ID)
				if err != nil {
					return nil, err
				}
				entry.Attributes.Hash = pagesMetadata.Chapter.Hash
				entry.Attributes.Data = pagesMetadata.Chapter.Data
			}
		}

		entries = append(entries, res.Data...)
		if res.Offset >= res.Total {
			break
		}
		queries.Set("offset", strconv.Itoa(res.Offset+res.Limit))
	}

	return entries, nil
}

// GetChaptersEx retrieves all chapters of specified manga
//  - This function returns normalized data
func GetChaptersEx(mangaId string, q FeedQuery) (chapter.Slice, error) {
	data, err := GetChapters(mangaId, q)
	if err != nil {
		return nil, err
	}
	var entries chapter.Slice
	for _, entry := range data {
		if x := entry.Normalize(); x != nil {
			entries = append(entries, x)
		}
	}
	return entries, err
}

// SearchChapter searches and retrieves chapter data
func SearchChapter(q ChapterQuery) ([]*Chapter, *QueryResultInfo, error) {
	for _, id := range q.Ids {
		if err := validateId(id); err != nil {
			return nil, nil, err
		}
	}
	_ = limiter.Wait(context.Background())

	buf, err := get(q.buildURL())
	if err != nil {
		return nil, nil, err
	}

	res := &Response[[]*Chapter]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, nil, err
	}

	if len(res.Errors) > 0 {
		return nil, nil, errors.New(res.Errors[0].Detail)
	}
	return res.Data, &QueryResultInfo{res.Limit, res.Offset, res.Total}, nil
}

// SearchChapterEx searches and retrieves chapter data
//  - This function returns normalized data
func SearchChapterEx(q ChapterQuery) ([]*chapter.Chapter, *QueryResultInfo, error) {
	data, info, err := SearchChapter(q)
	if err != nil {
		return nil, nil, err
	}
	var entries []*chapter.Chapter
	for _, entry := range data {
		if x := entry.Normalize(); x != nil {
			entries = append(entries, x)
		}
	}
	return entries, info, err
}

func GetPages(chapterId string) (*ChapterPagesMetadata, error) {
	limiter.Wait(context.Background())

	u := path.Join("/at-home/server", chapterId)
	buf, err := get(buildURL(u))
	if err != nil {
		return nil, err
	}

	res := &Response[any]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		return nil, errors.New(res.Errors[0].Detail)
	}
	return res.ChapterPagesMetadata, err
}
