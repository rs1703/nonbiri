package anilist

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"time"

	"nonbiri/utils"
	"nonbiri/utils/logger"

	"golang.org/x/time/rate"
)

const baseURL = "https://graphql.anilist.co"

var limiter = rate.NewLimiter(rate.Every(time.Minute/90), 1) // 90 requests/min

// GetBanner retrieves header banner
func GetBanner(mediaId string) (result string, _ error) {
	id, err := strconv.Atoi(mediaId)
	if err != nil {
		return result, err
	}
	limiter.Wait(context.Background())

	obj := &GraphQl{
		`query ($id: Int) {Media (id: $id, type: MANGA) {bannerImage}}`,
		fmt.Sprintf(`{"id": %d}`, id),
	}

	res, err := http.Post(baseURL, "application/json", obj.Marshal())
	if err != nil {
		return result, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Unexpected(err)
		}
	}()

	buf, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return result, err
	}

	body := &struct {
		Data struct {
			Media struct {
				Banner string `json:"bannerImage"`
			} `json:"Media"`
		} `json:"data"`
	}{}
	return body.Data.Media.Banner, utils.Unmarshal(buf, body)
}

type GraphQl struct {
	Query     string `json:"query"`
	Variables string `json:"variables"`
}

func (o *GraphQl) Marshal() *strings.Reader {
	buf, _ := utils.Marshal(o)
	return strings.NewReader(string(buf))
}
