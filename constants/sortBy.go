package constants

type Sort int

var Sorts = struct {
	Title,
	totalChapters,
	CreatedAt,
	UpdatedAt,
	PublishAt,
	LatestUploadedChapter,
	FollowedCount,
	Relevance,
	Volume,
	Chapter,

	UnreadedChapters Sort
}{
	Title:                 1,
	totalChapters:         2,
	CreatedAt:             3,
	UpdatedAt:             4,
	PublishAt:             5,
	LatestUploadedChapter: 6,
	FollowedCount:         7,
	Relevance:             8,
	Volume:                9,
	Chapter:               10,

	UnreadedChapters: 20,
}

func (self Sort) String() string {
	switch self {
	case Sorts.totalChapters:
		return "totalChapters"
	case Sorts.CreatedAt:
		return "createdAt"
	case Sorts.UpdatedAt:
		return "updatedAt"
	case Sorts.PublishAt:
		return "publishAt"
	case Sorts.LatestUploadedChapter:
		return "latestUploadedChapter"
	case Sorts.FollowedCount:
		return "followedCount"
	case Sorts.Relevance:
		return "relevance"
	case Sorts.Volume:
		return "volume"
	case Sorts.Chapter:
		return "chapter"
	default:
		return "title"
	}
}
