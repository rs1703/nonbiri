package prefs

import (
	. "nonbiri/constants"

	"github.com/spf13/viper"
)

type BrowsePreference struct {
	Language       Language   `json:"language"`
	Origins        []Language `json:"origins"`
	ExcludedTags   []string   `json:"excludedTags"`
	ContentRatings []Rating   `json:"ratings"`
}

var Browse = &BrowsePreference{
	Language:     Languages.English,
	Origins:      []Language{Languages.Japan},
	ExcludedTags: []string{"Boys' Love"},
	ContentRatings: []Rating{
		Ratings.Safe,
		Ratings.Suggestive,
		Ratings.Erotica,
	},
}

func (*BrowsePreference) Update(new *BrowsePreference) {
	mutex.Lock()
	defer mutex.Unlock()

	*Browse = *new
	viper.Set("browse", Browse)
	viper.WriteConfig()
}
