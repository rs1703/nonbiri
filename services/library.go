package services

import (
	"sync"
	"time"

	. "nonbiri/constants"
	. "nonbiri/database"

	"nonbiri/models/manga"

	"nonbiri/prefs"
	"nonbiri/websocket"

	"github.com/rs1703/logger"
)

type UpdateState struct {
	Progress int    `json:"progress"`
	Total    int    `json:"total"`
	Current  string `json:"current"`
}

var lCache manga.Slice
var updateState *UpdateState

func Library(isCaching bool) manga.Slice {
	var track func()
	if !isCaching {
		track = logger.Track()
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
	if updateState != nil {
		return updateState
	}

	updateState = &UpdateState{}

	prefs.Library.LastUpdated = time.Now().Unix()
	prefs.Library.Update(nil)

	go func() {
		var err error
		defer func() {
			updateState = nil
		}()

		q := `SELECT id, title FROM manga
					WHERE manga.followed = TRUE`

		follows := manga.Slice{}
		if err = DB.Select(&follows, q); err != nil {
			logger.Err.Println(err)
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

			if _, err = UpdateManga(entry.ID, true); err != nil {
				logger.Err.Println(entry.ID, err)
			}
			updateState.Progress++
		}

		websocket.Broadcast <- &websocket.OutgoingMessage{
			Task: Tasks.GetUpdateLibraryState,
		}

		prefs.Library.LastUpdated = time.Now().Unix()
		prefs.Library.Update(nil)

		cacheLibrary(false)
		cacheUpdates(false)
	}()

	return updateState
}

func GetUpdateLibraryState() *UpdateState {
	return updateState
}

var scheduler = struct {
	Ticker *time.Ticker
	Done   chan bool
	sync.Mutex
}{
	Done: make(chan bool),
}

func ScheduleUpdate() {
	scheduler.Lock()
	defer scheduler.Unlock()

	if scheduler.Ticker != nil {
		scheduler.Done <- true
	}

	frequency := prefs.Library.UpdateFrequency * time.Hour
	lastUpdated := time.Unix(prefs.Library.LastUpdated, 0)

	if time.Now().After(lastUpdated.Add(frequency)) {
		UpdateLibrary()
	}

	scheduler.Ticker = time.NewTicker(frequency)
	go func() {
		for {
			select {
			case <-scheduler.Done:
				scheduler.Ticker.Stop()
				return
			case <-scheduler.Ticker.C:
				if updateState == nil {
					UpdateLibrary()
				}
			}
		}
	}()
}

func cacheLibrary(isUpdating bool) {
	if len(lCache) == 0 || isUpdating {
		return
	}
	lCache = manga.Slice{}
	go Library(true)
}
