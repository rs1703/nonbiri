package mangadex

import (
	"context"
	"errors"
	"fmt"
	"nonbiri/models/manga"
	"nonbiri/utils"
	"nonbiri/utils/query"
	"time"

	"golang.org/x/time/rate"
)

type Authorization struct {
	Username,
	Email,
	Password string
}

type Token struct {
	Session,
	Refresh string
}

var loginLimiter = rate.NewLimiter(rate.Every(time.Hour/30), 1) // 30 requests/h

func Login(o Authorization) (*Token, error) {
	if len(o.Username) == 0 && len(o.Email) == 0 {
		return nil, errors.New("username and email can not be empty at the same time")
	}

	if len(o.Password) == 0 {
		return nil, errors.New(("password can not be empty"))
	}

	loginLimiter.Wait(context.Background())

	url := buildURL("auth/login")
	buf, err := postJSON(url, o)
	if err != nil {
		return nil, err
	}

	res := &Response[any]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		return nil, errors.New(res.Errors[0].Detail)
	}
	return res.Token, nil
}

var refreshLimiter = rate.NewLimiter(rate.Every(time.Hour/60), 1) // 60 requests/h

func RefreshToken(refreshToken string) (*Token, error) {
	if len(refreshToken) == 0 {
		return nil, errors.New("refreshToken can not be empty")
	}

	refreshLimiter.Wait(context.Background())

	url := buildURL("auth/refresh")
	buf, err := postJSON(url, fmt.Sprintf(`{"token": "%s"}`, refreshToken))
	if err != nil {
		return nil, err
	}

	res := &Response[any]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return nil, err
	}

	if len(res.Errors) > 0 {
		return nil, errors.New(res.Errors[0].Detail)
	}
	return res.Token, nil
}

func CheckToken(sessionToken string) (bool, error) {
	if len(sessionToken) == 0 {
		return false, errors.New("sessionToken can not be empty")
	}

	limiter.Wait(context.Background())

	header := map[string]string{}
	header["Authorization"] = fmt.Sprintf("Bearer %s", sessionToken)

	url := buildURL("auth/check")
	buf, err := get(url, header)
	if err != nil {
		return false, err
	}

	res := &Response[any]{}
	if err := utils.Unmarshal(buf, res); err != nil {
		return false, err
	}

	if len(res.Errors) > 0 {
		return false, errors.New(res.Errors[0].Detail)
	}
	return res.IsAuthenticated, nil
}

type FollowQuery struct {
	Limit    int      `define:"limit,omitempty" min:"1" max:"100" default:"10"`
	Offset   int      `define:"offset,omitempty"`
	Includes []string `define:"includes[]" enum:"manga,cover_art,author,artist,tag" default:"manga,cover_art,author,artist"`
}

func (o *FollowQuery) buildURL() string {
	return buildURL("user/follows/manga", query.Parse(o))
}

func GetFollows(token *Token, q FollowQuery) ([]*Manga, error) {
	if token == nil || len(token.Session) == 0 {
		return nil, errors.New("session token can not be empty")
	}

	ok, err := CheckToken(token.Session)
	if err != nil {
		return nil, err
	}

	if !ok {
		if len(token.Refresh) == 0 {
			return nil, errors.New("session token is expired and failed to retrieve a new session token because refresh token is empty")
		}

		newToken, err := RefreshToken(token.Refresh)
		if err != nil {
			return nil, err
		}
		*token = *newToken
	}

	var entries []*Manga

	for {
		_ = limiter.Wait(context.Background())

		buf, err := get(q.buildURL())
		if err != nil {
			return nil, err
		}

		res := &Response[[]*Manga]{}
		if err := utils.Unmarshal(buf, res); err != nil {
			return nil, err
		}

		entries = append(entries, res.Data...)
		if res.Offset >= res.Total {
			break
		}
		q.Offset = res.Offset + res.Limit
	}

	return entries, nil
}

func GetFollowsEx(token *Token, q FollowQuery) (manga.Slice, error) {
	data, err := GetFollows(token, q)
	if err != nil {
		return nil, err
	}
	var entries manga.Slice
	for _, entry := range data {
		if x := entry.Normalize(); x != nil {
			entries = append(entries, x)
		}
	}
	return entries, err
}
