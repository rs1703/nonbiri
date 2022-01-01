package mangadex

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	. "nonbiri/constants"
	"nonbiri/utils/logger"

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

const (
	baseURL = "https://api.mangadex.org"
	// TODO: Random user-agent
	userAgent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36"
)

var limiter = rate.NewLimiter(rate.Every(time.Second/5), 1) // 5 requests/s

func get(url string, header ...map[string]string) ([]byte, error) {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	if header != nil {
		for k, v := range header[0] {
			req.Header.Set(k, v)
		}
	}

	req.Header.Set("User-Agent", userAgent)

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Unexpected(err)
		}
	}()
	return io.ReadAll(res.Body)
}

func postJSON(url string, body any) ([]byte, error) {
	buf, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(buf))
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("COntent-Type", "application/json")

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Unexpected(err)
		}
	}()
	return io.ReadAll(res.Body)
}

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
