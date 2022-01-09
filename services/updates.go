package services

import (
	"nonbiri/models/chapter"

	"github.com/rs1703/logger"
)

var uCache chapter.Slice

func Updates(isCaching bool) (_ chapter.Slice, err error) {
	var track func()
	if !isCaching {
		track = logger.Track()
	}

	if len(uCache) == 0 {
		uCache, err = chapter.All(360)
	}

	if track != nil {
		track()
	}
	return uCache, err
}

func cacheUpdates(isUpdating bool) {
	if len(uCache) == 0 || isUpdating {
		return
	}
	uCache = chapter.Slice{}
	go Updates(true)
}
