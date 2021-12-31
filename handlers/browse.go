package handlers

import (
	"nonbiri/services"
	"nonbiri/utils"
	"nonbiri/websocket"
)

func Browse(message *websocket.IncomingMessage) (any, error) {
	var o services.BrowseQuery
	if err := utils.Unmarshal(message.Body, &o); err != nil {
		return nil, err
	}
	return services.Browse(o)
}
