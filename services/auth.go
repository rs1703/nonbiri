package services

import (
	"nonbiri/models/manga"
	"nonbiri/prefs"
	"nonbiri/scrapers/mangadex"
	"nonbiri/utils"
)

func Login(o mangadex.Authorization) (_ bool, err error) {
	defer utils.Track("services.Login")()

	token, err := mangadex.Login(o)
	if err != nil {
		return
	}

	prefs.Auth.SessionToken = token.Session
	prefs.Auth.RefreshToken = token.Refresh
	prefs.Auth.Save()

	return true, nil
}

func RefreshToken() (_ bool, err error) {
	defer utils.Track("services.RefreshToken")()

	token, err := mangadex.RefreshToken(prefs.Auth.RefreshToken)
	if err != nil {
		return
	}

	prefs.Auth.SessionToken = token.Session
	prefs.Auth.RefreshToken = token.Refresh
	prefs.Auth.Save()

	return true, nil
}

func CheckToken() (bool, error) {
	defer utils.Track("services.CheckToken")()
	return mangadex.CheckToken(prefs.Auth.SessionToken)
}

func GetFollows() (manga.Slice, error) {
	defer utils.Track("services.GetFollows")()

	token := &mangadex.Token{
		Session: prefs.Auth.SessionToken,
		Refresh: prefs.Auth.RefreshToken,
	}

	data, err := mangadex.GetFollowsEx(token, mangadex.FollowQuery{})
	if err != nil {
		return nil, err
	}
	return data, nil
}
