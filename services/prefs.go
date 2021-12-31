package services

import (
	"nonbiri/prefs"
	"nonbiri/utils"
)

type Prefs struct {
	Browse  *prefs.BrowsePreference  `json:"browse"`
	Library *prefs.LibraryPreference `json:"library"`
	Reader  *prefs.ReaderPreference  `json:"reader"`
}

func GetPrefs() *Prefs {
	defer utils.Track("services.GetPrefs")()
	return &Prefs{
		prefs.Browse,
		prefs.Library,
		prefs.Reader,
	}
}

func UpdateBrowsePref(new *prefs.BrowsePreference) (*prefs.BrowsePreference, error) {
	prefs.Browse.Update(new)
	return prefs.Browse, nil
}

func UpdateLibraryPref(new *prefs.LibraryPreference) (*prefs.LibraryPreference, error) {
	updateSchedule := new.UpdateFrequency != prefs.Library.UpdateFrequency
	defer func() {
		if updateSchedule {
			go ScheduleUpdate()
		}
	}()
	prefs.Library.Update(new)
	return prefs.Library, nil
}

func UpdateReaderPref(new *prefs.ReaderPreference) (*prefs.ReaderPreference, error) {
	prefs.Reader.Update(new)
	return prefs.Reader, nil
}
