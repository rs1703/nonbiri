package handlers

import (
	"nonbiri/services"
	"nonbiri/websocket"
)

func GetChapter(message *websocket.IncomingMessage) (any, error) {
	return services.GetChapter(message.Body.(string))
}

func UpdateChapter(message *websocket.IncomingMessage) (any, error) {
	return services.UpdateChapter(message.Body.(string))
}

func GetChapters(message *websocket.IncomingMessage) (any, error) {
	return services.GetChapters(message.Body.(string))
}

func UpdateChapters(message *websocket.IncomingMessage) (any, error) {
	return services.UpdateChapters(message.Body.(string), false)
}
