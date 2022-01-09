package services

import (
	. "nonbiri/constants"
	. "nonbiri/database"

	"nonbiri/models/manga"
	"nonbiri/models/tag"
	"nonbiri/scrapers/mangadex"

	"github.com/jmoiron/sqlx"
	"github.com/rs1703/logger"
)

type BrowseData struct {
	Entries manga.Slice `json:"entries"`
	Query   BrowseQuery `json:"query"`
	*mangadex.QueryResultInfo
}

// Simplified version of MangaQuery
type BrowseQuery struct {
	Limit             int           `json:"limit,omitempty"`
	Offset            int           `json:"offset,omitempty"`
	Title             string        `json:"title,omitempty"`
	Authors           []string      `json:"author,omitempty"`
	Artists           []string      `json:"artist,omitempty"`
	Year              int           `json:"year,omitempty"`
	IncludedTags      []string      `json:"includedTag,omitempty"`
	ExcludedTags      []string      `json:"excludedTag,omitempty"`
	Status            []Status      `json:"status,omitempty"`
	Origin            []Language    `json:"origin,omitempty"`
	ExcludedOrigin    []Language    `json:"excludedOrigin,omitempty"`
	AvailableLanguage []Language    `json:"availableLanguage,omitempty"`
	Demographic       []Demographic `json:"demographic,omitempty"`
	Ids               []string      `json:"id,omitempty"`
	ContentRating     []Rating      `json:"rating,omitempty"`

	Sort  Sort  `json:"sort,omitempty"`
	Order Order `json:"order,omitempty"`
}

func Browse(q BrowseQuery) (result *BrowseData, err error) {
	defer logger.Track()()

	data, info, err := mangadex.SearchMangaEx(q.Denormalize())
	if err != nil {
		logger.Err.Println(err)
		return nil, err
	}

	if len(data) > 0 {
		var mIds []string
		mMap := make(manga.Map)

		for _, m := range data {
			mIds = append(mIds, m.ID)
			mMap[m.ID] = m
		}

		tx, err := DB.Beginx()
		if err != nil {
			logger.Err.Println(err)
			return nil, err
		}

		query, args, err := sqlx.In("SELECT * FROM manga WHERE id IN (?)", mIds)
		if err != nil {
			logger.Err.Println(err)
			return nil, err
		}

		rows, err := tx.Queryx(tx.Rebind(query), args...)
		if err != nil {
			logger.Err.Println(err)
			return nil, err
		}

		for rows.Next() {
			m := &manga.Manga{}
			if err := rows.StructScan(m); err != nil {
				logger.Err.Println(err)
				return nil, err
			}

			m.Metadata = mMap[m.ID].Metadata
			*mMap[m.ID] = *m

			if _, err := m.UpdateMetadata(tx); err != nil {
				logger.Err.Println(err)
				return nil, err
			}
		}

		if err := tx.Commit(); err != nil {
			logger.Err.Println(err)
			return nil, err
		}

		cacheLibrary(false)
	}
	return &BrowseData{Entries: data, Query: q, QueryResultInfo: info}, nil
}

func (self *BrowseQuery) Denormalize() mangadex.MangaQuery {
	if self.Limit == 0 {
		self.Limit = 36
	}

	o := mangadex.MangaQuery{
		Limit:   self.Limit,
		Offset:  self.Offset,
		Title:   self.Title,
		Authors: self.Authors,
		Artists: self.Artists,
		Year:    self.Year,
		Ids:     self.Ids,
	}

	for _, v := range self.Status {
		o.Status = append(o.Status, v.String())
	}

	if len(self.Origin) > 0 {
		for _, v := range self.Origin {
			o.OriginalLanguage = append(o.OriginalLanguage, v.String())
		}
	}

	for _, v := range self.ExcludedOrigin {
		o.ExcludedOriginalLanguage = append(o.ExcludedOriginalLanguage, v.String())
	}

	if len(self.AvailableLanguage) > 0 {
		for _, v := range self.AvailableLanguage {
			o.AvailableTranslatedLanguage = append(o.AvailableTranslatedLanguage, v.String())
		}
	}

	for _, v := range self.Demographic {
		o.PublicationDemographic = append(o.PublicationDemographic, v.String())
	}

	if self.Sort > 0 {
		o.Sort.By = self.Sort.String()
	}

	if self.Order > 0 {
		o.Sort.Order = self.Order.String()
	}

	for _, v := range self.IncludedTags {
		if len(v) == 48 {
			o.IncludedTags = append(o.IncludedTags, v)
		} else if t, err := tag.One(v); err == nil {
			o.IncludedTags = append(o.IncludedTags, t.ID)
		}
	}

	if len(self.ExcludedTags) > 0 {
		for _, v := range self.ExcludedTags {
			if len(v) == 48 {
				o.ExcludedTags = append(o.ExcludedTags, v)
			} else if t, err := tag.One(v); err == nil {
				o.ExcludedTags = append(o.ExcludedTags, t.ID)
			}
		}
	}

	if len(self.ContentRating) > 0 {
		for _, v := range self.ContentRating {
			o.ContentRating = append(o.ContentRating, v.String())
		}
	}

	return o
}
