package handlers

import (
	"nonbiri/services"
	"nonbiri/utils"
	"nonbiri/websocket"
)

func GetManga(message *websocket.IncomingMessage) (any, error) {
	return services.GetManga(message.Body.(string))
}

func UpdateManga(message *websocket.IncomingMessage) (any, error) {
	return services.UpdateManga(message.Body.(string), false)
}

func FollowManga(message *websocket.IncomingMessage) (any, error) {
	body := &H{}
	if err := utils.Unmarshal(message.Body, body); err != nil {
		return nil, err
	}
	return services.FollowManga(body.MangaId, body.FollowState)
}

func UnfollowManga(message *websocket.IncomingMessage) (any, error) {
	return services.UnfollowManga(message.Body.(string))
}
