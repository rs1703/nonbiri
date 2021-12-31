package constants

import "errors"

var ErrInvalidId = errors.New("invalid id")
var ErrMangaNotFound = errors.New("manga does not exists")
var ErrChapterNotFound = errors.New("chapter does not exists")
var ErrHistoryNotFound = errors.New("history does not exists")
var ErrTagNotFound = errors.New("tag does not exists")
