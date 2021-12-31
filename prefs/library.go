package prefs

import (
	. "nonbiri/constants"

	"github.com/spf13/viper"
)

type LibraryPreference struct {
	Sort  Sort  `json:"sort"`
	Order Order `json:"order"`
}

var Library = &LibraryPreference{
	Sort:  Sorts.LatestUploadedChapter,
	Order: Orders.DESC,
}

func (*LibraryPreference) Update(new *LibraryPreference) {
	mutex.Lock()
	defer mutex.Unlock()

	*Library = *new
	viper.Set("library", Library)
	viper.WriteConfig()
}
