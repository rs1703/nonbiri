package prefs

import (
	. "nonbiri/constants"
	"time"

	"github.com/spf13/viper"
)

type LibraryPreference struct {
	Sort            Sort          `json:"sort"`
	Order           Order         `json:"order"`
	UpdateFrequency time.Duration `json:"updateFrequency"`
	LastUpdated     int64         `json:"lastUpdated"`
}

var Library = &LibraryPreference{
	Sort:            Sorts.LatestUploadedChapter,
	Order:           Orders.DESC,
	UpdateFrequency: 2,
}

func (*LibraryPreference) Update(new *LibraryPreference) {
	mutex.Lock()
	defer mutex.Unlock()

	if new != nil {
		*Library = *new
	}
	viper.Set("library", Library)
	viper.WriteConfig()
}
