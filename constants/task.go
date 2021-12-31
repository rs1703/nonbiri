package constants

type Task int

var Tasks = struct {
	GetManga,
	UpdateManga,
	FollowManga,
	UnfollowManga Task

	GetChapter,
	UpdateChapter Task
	GetChapters,
	UpdateChapters Task

	ReadPage,
	ReadChapter,
	UnreadChapter,

	Library,
	Browse,
	Tags,
	Updates,
	History Task

	GetPrefs,
	GetBrowsePreference,
	GetLibraryPreference,
	GetReaderPreference Task

	UpdateBrowsePreference,
	UpdateLibraryPreference,
	UpdateReaderPreference Task

	UpdateLibrary,
	GetUpdateLibraryState Task
}{
	// Send and receive tasks
	GetManga:      1,
	UpdateManga:   2,
	FollowManga:   3,
	UnfollowManga: 4,

	GetChapter:     5,
	UpdateChapter:  6,
	GetChapters:    7,
	UpdateChapters: 8,

	ReadPage:      9,
	ReadChapter:   10,
	UnreadChapter: 11,

	Library: 30,
	Browse:  31,
	Tags:    32,
	Updates: 33,
	History: 34,

	GetPrefs:             40,
	GetBrowsePreference:  41,
	GetLibraryPreference: 42,
	GetReaderPreference:  43,

	UpdateBrowsePreference:  51,
	UpdateLibraryPreference: 52,
	UpdateReaderPreference:  53,

	UpdateLibrary:         60,
	GetUpdateLibraryState: 61,
}
