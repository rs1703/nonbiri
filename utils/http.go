package utils

import (
	"bytes"
	"io"
	"net/http"

	"github.com/rs1703/logger"
)

const userAgent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36"

func Get(url string, header ...map[string]string) ([]byte, error) {
	client := &http.Client{}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", userAgent)

	if header != nil {
		for k, v := range header[0] {
			req.Header.Set(k, v)
		}
	}

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Err.Println(err)
		}
	}()
	return io.ReadAll(res.Body)
}

func PostJSON(url string, body any, header ...map[string]string) ([]byte, error) {
	buf, err := Marshal(body)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(buf))
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Content-Type", "application/json")

	if header != nil {
		for k, v := range header[0] {
			req.Header.Set(k, v)
		}
	}

	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Err.Println(err)
		}
	}()
	return io.ReadAll(res.Body)
}
