package services

import (
	. "nonbiri/constants"
	. "nonbiri/database"
	"sync"

	"nonbiri/models/manga"
	"nonbiri/utils"
	"nonbiri/utils/logger"
	"nonbiri/websocket"
)

type UpdateState struct {
	Progress int    `json:"progress"`
	Total    int    `json:"total"`
	Current  string `json:"current"`
}

var lCache manga.Slice
var updateState *UpdateState
var lMutex = sync.Mutex{}

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

func UpdateLibrary() *UpdateState {
	lMutex.Lock()
	defer lMutex.Unlock()

	if updateState != nil {
		return updateState
	}
	updateState = &UpdateState{}

	go func() {
		var err error
		defer func() {
			updateState = nil
		}()

		q := `SELECT id, title FROM manga
					WHERE manga.followed = TRUE`

		follows := manga.Slice{}
		if err = DB.Select(&follows, q); err != nil {
			logger.Unexpected(err)
			return
		}

		updateState.Total = len(follows)
		if updateState.Total == 0 {
			return
		}

		for _, entry := range follows {
			updateState.Current = entry.Title
			websocket.Broadcast <- &websocket.OutgoingMessage{
				Task: Tasks.GetUpdateLibraryState,
				Body: updateState,
			}

			entry, err = UpdateManga(entry.ID, true)
			if err != nil {
				logger.Unexpected(err)
				continue
			}
			updateState.Progress++
		}

		websocket.Broadcast <- &websocket.OutgoingMessage{
			Task: Tasks.GetUpdateLibraryState,
		}
	}()

	return updateState
}

func GetUpdateLibraryState() *UpdateState {
	return updateState
}

func cacheLibrary(isUpdating bool) {
	if len(lCache) == 0 || isUpdating {
		return
	}
	lCache = manga.Slice{}
	go Library(true)
}
