package mangadex

import (
	"net/url"
	"time"

	. "nonbiri/constants"

	"golang.org/x/time/rate"
)

type Response[T any] struct {
	Data   T
	Errors []struct {
		Detail string
		Status int
	}
	Result               string
	Limit, Offset, Total int

	*ChapterPagesMetadata

	Token           *Token
	IsAuthenticated bool
}

type ChapterPagesMetadata struct {
	BaseURL string `json:"baseUrl"`
	Chapter struct {
		Data []string
		Hash string
	}
}

type QueryResultInfo struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
	Total  int `json:"total"`
}

const baseURL = "https://api.mangadex.org"

var limiter = rate.NewLimiter(rate.Every(time.Second/5), 1) // 5 requests/s

func buildURL(pathname string, q ...*url.Values) string {
	u, _ := url.Parse(baseURL)
	u.Path = pathname
	if q != nil {
		u.RawQuery = q[0].Encode()
	}
	return u.String()
}

func validateId(id string) error {
	if len(id) != 36 {
		return ErrInvalidId
	}
	return nil
}
