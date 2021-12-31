package mangadex

import (
	. "nonbiri/constants"
	"nonbiri/utils"

	"nonbiri/models/entity"
	"nonbiri/models/manga"
	"nonbiri/models/tag"
	"nonbiri/utils/logger"
)

type Localizations struct {
	EN string
	JA string
	JP string
}

func (self *Manga) Normalize() *manga.Manga {
	m := &manga.Manga{ID: self.ID}
	if !parseLocalizations(self.Attributes.Title, &m.Title) {
		return nil
	}

	parseLocalizations(self.Attributes.Description, &m.Description)
	m.CreatedAt = utils.ParseDateString(self.Attributes.CreatedAt).Unix()
	if len(self.Attributes.UpdatedAt) > 0 {
		m.UpdatedAt = utils.ParseDateString(self.Attributes.UpdatedAt).Unix()
	}

	for _, t := range self.Attributes.Tags {
		if tag := t.Normalize(); tag != nil {
			m.Tags = append(m.Tags, tag.Name)
		}
	}

	if self.Attributes.Links != nil {
		if jSON, valid := self.Attributes.Links.(map[string]any); valid {
			if err := utils.Unmarshal(jSON, &m.Links); err != nil {
				logger.Unexpected(err)
			}
		}
	}

	if self.Attributes.Links != nil {
		if jSON, valid := self.Attributes.Links.(map[string]any); valid {
			if err := utils.Unmarshal(jSON, &m.Links); err != nil {
				logger.Unexpected(err)
			}
		}
	}

	switch self.Attributes.OriginalLanguage {
	case Languages.English.String():
		m.Origin = Languages.English
		break
	case Languages.Chinese.String():
		m.Origin = Languages.Chinese
		break
	case Languages.Japan.String():
		m.Origin = Languages.Japan
		break
	case Languages.Korean.String():
		m.Origin = Languages.Korean
		break
	}

	switch self.Attributes.PublicationDemographic {
	case Demographics.Josei.String():
		m.Demographic = Demographics.Josei
		break
	case Demographics.Seinen.String():
		m.Demographic = Demographics.Seinen
		break
	case Demographics.Shoujo.String():
		m.Demographic = Demographics.Shoujo
		break
	case Demographics.Shounen.String():
		m.Demographic = Demographics.Shounen
		break
	}

	switch self.Attributes.ContentRating {
	case Ratings.Safe.String():
		m.Rating = Ratings.Safe
		break
	case Ratings.Suggestive.String():
		m.Rating = Ratings.Suggestive
		break
	case Ratings.Erotica.String():
		m.Rating = Ratings.Erotica
		break
	case Ratings.Pornographic.String():
		m.Rating = Ratings.Pornographic
		break
	}

	switch self.Attributes.Status {
	case Statuses.Ongoing.String():
		m.Status = Statuses.Ongoing
		break
	case Statuses.Completed.String():
		m.Status = Statuses.Completed
		break
	case Statuses.Cancelled.String():
		m.Status = Statuses.Cancelled
		break
	case Statuses.Hiatus.String():
		m.Status = Statuses.Hiatus
		break
	}

	for _, r := range self.Relationships {
		switch Entity(r.Type) {
		case Entities.Cover:
			if attrs := parseAttrs(r.Attributes); attrs != nil {
				m.Cover = attrs.FileName
			}
			break
		case Entities.Artist, Entities.Author:
			if attrs := parseAttrs(r.Attributes); attrs != nil {
				entity := &entity.Entity{ID: r.ID, Name: attrs.Name}
				if r.Type == string(Entities.Artist) {
					m.Artists = append(m.Artists, entity)
				} else {
					m.Authors = append(m.Authors, entity)
				}
			}
			break
		case Entities.Manga:
			attrs := &mAttrs{}
			if jSON, valid := r.Attributes.(map[string]any); valid {
				if err := utils.Unmarshal(jSON, attrs); err != nil {
					logger.Unexpected(err)
				} else {
					related := &manga.Related{ID: r.ID, Type: r.Related}
					if parseLocalizations(attrs.Title, &related.Title) {
						m.Relateds = append(m.Relateds, related)
					}
				}
			}
			break
		}
	}

	return m
}

func (self *Tag) Normalize() *tag.Tag {
	tag := &tag.Tag{ID: self.ID}
	if !parseLocalizations(self.Attributes.Name, &tag.Name) {
		return nil
	}
	return tag
}

func parseLocalizations(data any, dst *string) bool {
	if data != nil && dst != nil {
		if jSON, valid := data.(map[string]any); valid {
			loc := &Localizations{}
			if err := utils.Unmarshal(jSON, loc); err != nil {
				logger.Unexpected(err)
			} else {
				if len(loc.EN) > 0 {
					*dst = loc.EN
				} else if len(loc.JA) > 0 {
					*dst = loc.JA
				} else {
					*dst = loc.JP
				}
				return len(*dst) > 0
			}
		}
	}
	return false
}

func parseAttrs(data any) (attrs *rAttributes) {
	if data != nil {
		if jSON, valid := data.(map[string]any); valid {
			attrs := &rAttributes{}
			if err := utils.Unmarshal(jSON, attrs); err != nil {
				logger.Unexpected(err)
			} else {
				return attrs
			}
		}
	}
	return nil
}
