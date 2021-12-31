package handlers

import (
	"nonbiri/prefs"
	"nonbiri/services"
	"nonbiri/utils"
	"nonbiri/websocket"
)

func GetPrefs(message *websocket.IncomingMessage) (any, error) {
	return services.GetPrefs(), nil
}

func GetBrowsePreference(message *websocket.IncomingMessage) (any, error) {
	return prefs.Browse, nil
}

func GetLibraryPreference(message *websocket.IncomingMessage) (any, error) {
	return prefs.Library, nil
}

func GetReaderPreference(message *websocket.IncomingMessage) (any, error) {
	return prefs.Reader, nil
}

func UpdateBrowsePreference(message *websocket.IncomingMessage) (any, error) {
	data := &prefs.BrowsePreference{}
	if err := utils.Unmarshal(message.Body, data); err != nil {
		return nil, err
	}
	return services.UpdateBrowsePref(data)
}

func UpdateLibraryPreference(message *websocket.IncomingMessage) (any, error) {
	data := &prefs.LibraryPreference{}
	if err := utils.Unmarshal(message.Body, data); err != nil {
		return nil, err
	}
	return services.UpdateLibraryPref(data)
}

func UpdateReaderPreference(message *websocket.IncomingMessage) (any, error) {
	data := &prefs.ReaderPreference{}
	if err := utils.Unmarshal(message.Body, data); err != nil {
		return nil, err
	}
	return services.UpdateReaderPref(data)
}
