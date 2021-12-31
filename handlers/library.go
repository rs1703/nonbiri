package handlers

import (
	"nonbiri/services"
	"nonbiri/websocket"
)

func Library(message *websocket.IncomingMessage) (any, error) {
	return services.Library(false), nil
}

func UpdateLibrary(message *websocket.IncomingMessage) (any, error) {
	return services.UpdateLibrary(), nil
}

func GetUpdateLibraryState(message *websocket.IncomingMessage) (any, error) {
	return services.GetUpdateLibraryState(), nil
}
