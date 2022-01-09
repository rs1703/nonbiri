package main

import (
	_ "embed"

	"bytes"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"nonbiri/utils"

	. "nonbiri/constants"
	"nonbiri/websocket"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/handlers"
	"github.com/rs1703/logger"
)

type FileTransport struct {
	http.RoundTripper
}

var Instance *http.Server

//go:embed view/src/index.html
var html []byte

func StartServer() {
	gin.SetMode(Mode)

	router := gin.New()
	router.Static("/assets", "./assets")

	router.GET("/ws", websocket.Serve)
	router.GET("/0/*p", createReverseProxy(AssetsBaseURL.MangaDex))

	router.NoRoute(func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=UTF-8", html)
	})

	Instance = &http.Server{
		Addr:         ":42071",
		Handler:      handlers.RecoveryHandler()(handlers.CompressHandler(router)),
		WriteTimeout: 60 * time.Second,
		ReadTimeout:  60 * time.Second,
	}
	if err := Instance.ListenAndServe(); err != nil {
		logger.Err.Fatalln(err)
	}
}

func createReverseProxy(u string) func(c *gin.Context) {
	return func(c *gin.Context) { reverseProxy(u, c) }
}

func reverseProxy(u string, c *gin.Context) {
	path := c.Param("p")
	if cachePath := filepath.Join(CacheDirectory, path); utils.IsFileExists(cachePath) {
		c.File(cachePath)
		return
	}

	url, err := url.Parse(u)
	if err != nil {
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	url.Path = path

	proxy := httputil.NewSingleHostReverseProxy(url)
	proxy.Transport = &FileTransport{http.DefaultTransport}
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = url.Host
		req.URL = url
	}
	proxy.ServeHTTP(c.Writer, c.Request)
}

func (self *FileTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	res, err := self.RoundTripper.RoundTrip(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	buf, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode == http.StatusOK {
		localPath := filepath.Join(CacheDirectory, req.URL.Path)
		os.MkdirAll(filepath.Dir(localPath), os.ModePerm)

		f, err := os.Create(localPath)
		if err != nil {
			return nil, err
		}
		defer f.Close()

		if _, err = io.Copy(f, bytes.NewReader(buf)); err != nil {
			return nil, err
		}
	}

	res.Body = ioutil.NopCloser(bytes.NewReader(buf))
	return res, nil
}
