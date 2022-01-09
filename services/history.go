package services

import (
	. "nonbiri/constants"

	"nonbiri/models/history"

	"github.com/rs1703/logger"
)

func History() history.Slice {
	defer logger.Track()()

	return history.All(1000)
}

func ReadPage(id string, page uint16) (_ *history.History, err error) {
	defer logger.Track()()

	h, err := history.ByChapter(id)
	if err != nil {
		if err == ErrHistoryNotFound {
			h = &history.History{ChapterId: id}
		} else {
			return
		}
	}

	h.LastViewed.Set(page)
	if err == ErrHistoryNotFound {
		err = h.Save()
	} else {
		_, err = h.Update()
	}

	if err != nil {
		return
	}

	return h, nil
}

func setReadState(state bool, ids ...string) (_ history.Slice, err error) {
	histories := history.Slice{}

	for _, id := range ids {
		h, err := history.ByChapter(id)
		if err != nil {
			if err == ErrHistoryNotFound {
				h = &history.History{ChapterId: id}
			} else {
				return nil, err
			}
		}

		h.Readed.Set(state)
		h.LastViewed.Set(0)

		if err == ErrHistoryNotFound {
			err = h.Save()
		} else {
			_, err = h.Update()
		}

		if err == nil {
			histories = append(histories, h)
		}
	}

	cacheLibrary(false)
	return histories, nil
}

func ReadChapter(ids ...string) (history.Slice, error) {
	defer logger.Track()()

	return setReadState(true, ids...)
}

func UnreadChapter(ids ...string) (history.Slice, error) {
	defer logger.Track()()

	return setReadState(false, ids...)
}
