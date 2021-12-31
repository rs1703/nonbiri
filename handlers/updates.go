package handlers

import (
	"nonbiri/services"
	"nonbiri/websocket"
)

func Updates(message *websocket.IncomingMessage) (interface{}, error) {
	return services.Updates(false)
}
