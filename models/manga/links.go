package manga

import (
	"database/sql/driver"
	"nonbiri/utils"
)

type Links struct {
	AniList      string `json:"al,omitempty"`
	AnimePlanet  string `json:"ap,omitempty"`
	MangaWalker  string `json:"bw,omitempty"`
	MangaUpdates string `json:"mu,omitempty"`
	NovelUpdates string `json:"nu,omitempty"`
	Kitsu        string `json:"kt,omitempty"`
	Amazon       string `json:"amz,omitempty"`
	EmangaJapan  string `json:"ebj,omitempty"`
	MyAnimeList  string `json:"mal,omitempty"`
	RAW          string `json:"raw,omitempty"`
	ENGTL        string `json:"engtl,omitempty"`
}

func (l Links) Value() (driver.Value, error) {
	return utils.ObjectToBytes(l)
}

func (l *Links) Scan(src any) error {
	return utils.Unmarshal(src, l)
}
