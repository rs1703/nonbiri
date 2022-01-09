package services

import (
	"nonbiri/models/manga"
	"nonbiri/prefs"
	"nonbiri/scrapers/mangadex"

	"github.com/rs1703/logger"
)

func Login(o mangadex.Authorization) (bool, error) {
	defer logger.Track()()

	token, err := mangadex.Login(o)
	if err != nil {
		return false, err
	}

	prefs.Auth.SessionToken = token.Session
	prefs.Auth.RefreshToken = token.Refresh
	prefs.Auth.Save()

	return true, nil
}

func RefreshToken() (bool, error) {
	defer logger.Track()()

	token, err := mangadex.RefreshToken(prefs.Auth.RefreshToken)
	if err != nil {
		return false, err
	}

	prefs.Auth.SessionToken = token.Session
	prefs.Auth.RefreshToken = token.Refresh
	prefs.Auth.Save()

	return true, nil
}

func CheckToken() (bool, error) {
	defer logger.Track()()
	return mangadex.CheckToken(prefs.Auth.SessionToken)
}

func GetFollows() (manga.Slice, error) {
	defer logger.Track()()

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
