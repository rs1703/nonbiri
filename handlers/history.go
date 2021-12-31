package handlers

import (
	"nonbiri/services"
	"nonbiri/utils"
	"nonbiri/websocket"
)

func History(message *websocket.IncomingMessage) (any, error) {
	return services.History(), nil
}

func ReadPage(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	return services.ReadPage(body.ChapterId, body.Page)
}

func ReadChapter(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	if body.ChapterIds != nil && len(body.ChapterIds) > 0 {
		return services.ReadChapter(body.ChapterIds...)
	}
	return services.ReadChapter(body.ChapterId)
}

func UnreadChapter(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	if body.ChapterIds != nil && len(body.ChapterIds) > 0 {
		return services.UnreadChapter(body.ChapterIds...)
	}
	return services.UnreadChapter(body.ChapterId)
}
