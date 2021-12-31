package mangadex

import (
	. "nonbiri/constants"
	"nonbiri/utils"

	"nonbiri/models/chapter"
	"nonbiri/models/entity"
)

func (self *Chapter) Normalize() *chapter.Chapter {
	mangaId := self.MangaId()
	if mangaId == nil {
		return nil
	}

	c := &chapter.Chapter{ID: self.ID, MangaId: *mangaId}
	c.Title = self.Attributes.Title
	c.Volume = self.Attributes.Volume
	c.Chapter = self.Attributes.Chapter

	switch self.Attributes.TranslatedLanguage {
	case Languages.English.String():
		c.Language = Languages.English
		break
	case Languages.Chinese.String():
		c.Language = Languages.Chinese
		break
	case Languages.Japan.String():
		c.Language = Languages.Japan
		break
	case Languages.Korean.String():
		c.Language = Languages.Korean
		break
	}

	c.ExternalURL = self.Attributes.ExternalURL
	c.Hash = self.Attributes.Hash

	c.Pages = self.Attributes.Data

	c.CreatedAt = utils.ParseDateString(self.Attributes.CreatedAt).Unix()
	c.PublishAt = utils.ParseDateString(self.Attributes.PublishAt).Unix()
	if len(self.Attributes.UpdatedAt) > 0 {
		c.UpdatedAt = utils.ParseDateString(self.Attributes.UpdatedAt).Unix()
	}

	for _, r := range self.Relationships {
		if Entity(r.Type) == Entities.Group {
			if attrs := parseAttrs(r.Attributes); attrs != nil {
				c.Groups = append(c.Groups, &entity.Entity{
					ID:   r.ID,
					Name: attrs.Name,
				})
			}
		}
	}

	return c
}

func (self *Chapter) MangaId() *string {
	for _, r := range self.Relationships {
		if Entity(r.Type) == Entities.Manga {
			return &r.ID
		}
	}
	return nil
}
