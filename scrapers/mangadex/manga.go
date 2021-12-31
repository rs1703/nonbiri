package mangadex

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"path"

	. "nonbiri/constants"
	"nonbiri/utils"

	"nonbiri/models/manga"
	"nonbiri/models/tag"
	"nonbiri/utils/query"
)

// https://api.mangadex.org/docs.html#operation/get-search-manga
type MangaQuery struct {
	Limit                       int      `define:"limit,omitempty" min:"1" max:"100" default:"10"`
	Offset                      int      `define:"offset,omitempty"`
	Title                       string   `define:"title"`
	Authors                     []string `define:"authors[]"`
	Artists                     []string `define:"artists[]"`
	Year                        int      `define:"year,omitempty"`
	IncludedTags                []string `define:"includedTags[]"`
	IncludedTagsMode            string   `define:"includedTagsMode" enum:"AND,OR" default:"AND"`
	ExcludedTags                []string `define:"excludedTags[]"`
	ExcludedTagsMode            string   `define:"excludedTagsMode" enum:"AND,OR" default:"OR"`
	Status                      []string `define:"status[]" enum:"ongoing,completed,hiatus,cancelled"`
	OriginalLanguage            []string `define:"originalLanguage[]"`
	ExcludedOriginalLanguage    []string `define:"excludedOriginalLanguage[]"`
	AvailableTranslatedLanguage []string `define:"availableTranslatedLanguage[]"`
	PublicationDemographic      []string `define:"publicationDemographic[]" enum:"shounen,shoujo,josei,seinen,none"`
	Ids                         []string `define:"ids[]" max:"100"`
	ContentRating               []string `define:"contentRating[]" enum:"safe,suggestive,erotica,pornographic" default:"safe,suggestive,erotica"`

	// format: YYYY-MM-DDTHH:MM:SS
	CreatedAtSince string `define:"createdAtSince"`
	UpdatedAtSince string `define:"updatedAtSince"`

	Sort                 MangaSort `define:"order[$],map" default:"latestUploadedChapter,desc"`
	Includes             []string  `define:"includes[]" enum:"manga,cover_art,author,artist,tag" default:"manga,cover_art,author,artist"`
	HasAvailableChapters bool      `define:"hasAvailableChapters,omitempty"`
}

type MangaSort struct {
	By    string `enum:"title,year,createdAt,updatedAt,latestUploadedChapter,followedCount,relevance"`
	Order string `enum:"asc,desc"`
}

func (o *MangaQuery) buildURL() string {
	return buildURL("manga", query.Parse(o))
}

// GetManga retrieves manga metadata
func GetManga(id string) (*Manga, error) {
	if err := validateId(id); err != nil {
		return nil, err
	}

	_ = limiter.Wait(context.Background())

	q := &url.Values{}
	q.Add("includes[]", "manga")
	q.Add("includes[]", "cover_art")
	q.Add("includes[]", "author")
	q.Add("includes[]", "artist")

	url := buildURL(path.Join("manga", id), q)
	buf, err := get(url)
	if err != nil {
		return nil, err
	}

	res := &Response[*Manga]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		if res.Errors[0].Status == http.StatusNotFound {
			return nil, ErrMangaNotFound
		} else {
			return nil, errors.New(res.Errors[0].Detail)
		}
	}
	return res.Data, nil
}

// GetMangaEx retrieves manga metadata
//  - This function returns normalized data
func GetMangaEx(id string) (*manga.Manga, error) {
	data, err := GetManga(id)
	if err != nil {
		return nil, err
	}
	return data.Normalize(), err
}

// SearchManga searches and retrieves manga metadata
func SearchManga(q MangaQuery) ([]*Manga, *QueryResultInfo, error) {
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

	res := &Response[[]*Manga]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, nil, err
	}

	if len(res.Errors) > 0 {
		return nil, nil, errors.New(res.Errors[0].Detail)
	}
	return res.Data, &QueryResultInfo{res.Limit, res.Offset, res.Total}, nil
}

// SearchMangaEx searches and retrieves manga metadata
//  - This function returns normalized data
func SearchMangaEx(q MangaQuery) (manga.Slice, *QueryResultInfo, error) {
	data, info, err := SearchManga(q)
	if err != nil {
		return nil, nil, err
	}

	var entries manga.Slice
	for _, entry := range data {
		if x := entry.Normalize(); x != nil {
			entries = append(entries, x)
		}
	}
	return entries, info, err
}

// Tags retrieves all tags
func Tags() ([]*Tag, error) {
	_ = limiter.Wait(context.Background())

	buf, err := get(buildURL("manga/tag"))
	if err != nil {
		return nil, err
	}

	res := &Response[[]*Tag]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		return nil, errors.New(res.Errors[0].Detail)
	}
	return res.Data, nil
}

// TagsEx retrieves all tags
//  - This function returns normalized data
func TagsEx() ([]*tag.Tag, error) {
	data, err := Tags()
	if err != nil {
		return nil, err
	}

	var entries []*tag.Tag
	for _, entry := range data {
		if x := entry.Normalize(); data != nil {
			entries = append(entries, x)
		}
	}

	return entries, err
}
