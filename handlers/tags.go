package handlers

import (
	"nonbiri/services"
	"nonbiri/websocket"
)

func Tags(message *websocket.IncomingMessage) (any, error) {
	return services.Tags(), nil
}
