package services

import (
	"nonbiri/models/manga"
	"nonbiri/utils"
)

var lCache manga.Slice

func Library(isCaching bool) manga.Slice {
	var track func()
	if !isCaching {
		track = utils.Track("services.Library")
	}

	if len(lCache) == 0 {
		lCache = manga.Follows()
	}

	if track != nil {
		track()
	}
	return lCache
}

func cacheLibrary() {
	if len(lCache) == 0 {
		return
	}
	lCache = manga.Slice{}
	go Library(true)
}
