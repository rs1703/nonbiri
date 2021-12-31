package handlers

import (
	. "nonbiri/constants"
	"nonbiri/websocket"
)

type H struct {
	MangaId     string
	ChapterId   string   `json:"chapterId"`
	ChapterIds  []string `json:"chapterIds"`
	Page        uint16
	FollowState FollowState `json:"followState"`
	Limit       uint16
	PublishAt   int64 `json:"publishAt"`
}

func init() {
	websocket.Handle(Tasks.GetManga, GetManga)
	websocket.Handle(Tasks.UpdateManga, UpdateManga)
	websocket.Handle(Tasks.FollowManga, FollowManga)
	websocket.Handle(Tasks.UnfollowManga, UnfollowManga)

	websocket.Handle(Tasks.GetChapter, GetChapter)
	websocket.Handle(Tasks.UpdateChapter, UpdateChapter)
	websocket.Handle(Tasks.GetChapters, GetChapters)
	websocket.Handle(Tasks.UpdateChapters, UpdateChapters)

	websocket.Handle(Tasks.ReadPage, ReadPage)
	websocket.Handle(Tasks.ReadChapter, ReadChapter)
	websocket.Handle(Tasks.UnreadChapter, UnreadChapter)

	websocket.Handle(Tasks.Library, Library)
	websocket.Handle(Tasks.Browse, Browse)
	websocket.Handle(Tasks.Tags, Tags)
	websocket.Handle(Tasks.Updates, Updates)
	websocket.Handle(Tasks.History, History)

	websocket.Handle(Tasks.GetPrefs, GetPrefs)
	websocket.Handle(Tasks.GetBrowsePreference, GetBrowsePreference)
	websocket.Handle(Tasks.GetLibraryPreference, GetLibraryPreference)
	websocket.Handle(Tasks.GetReaderPreference, GetReaderPreference)

	websocket.Handle(Tasks.UpdateBrowsePreference, UpdateBrowsePreference)
	websocket.Handle(Tasks.UpdateLibraryPreference, UpdateLibraryPreference)
	websocket.Handle(Tasks.UpdateReaderPreference, UpdateReaderPreference)
}
