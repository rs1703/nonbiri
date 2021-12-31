package handlers

import (
	"nonbiri/services"
	"nonbiri/utils"
	"nonbiri/websocket"
)

func GetChapter(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	return services.GetChapter(body.ChapterId)
}

func UpdateChapter(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	return services.UpdateChapter(body.ChapterId)
}

func GetChapters(message *websocket.IncomingMessage) (any, error) {
	return services.GetChapters(message.Body.(string))
}

func UpdateChapters(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	return services.UpdateChapters(body.MangaId)
}
