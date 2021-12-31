package services

import (
	"nonbiri/models/chapter"
	"nonbiri/utils"
)

var uCache chapter.Slice

func Updates(isCaching bool) (_ chapter.Slice, err error) {
	var track func()
	if !isCaching {
		track = utils.Track("services.Updates")
	}

	if len(uCache) == 0 {
		uCache, err = chapter.All(360)
	}

	if track != nil {
		track()
	}
	return uCache, err
}

func cacheUpdates() {
	if len(uCache) == 0 || updateState != nil {
		return
	}
	uCache = chapter.Slice{}
	go Updates(true)
}
