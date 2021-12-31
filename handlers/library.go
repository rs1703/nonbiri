package handlers

import (
	"nonbiri/services"
	"nonbiri/websocket"
)

func Library(message *websocket.IncomingMessage) (any, error) {
	return services.Library(false), nil
}
