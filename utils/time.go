package utils

import (
	"log"
	"time"

	"nonbiri/utils/logger"
)

func Track(identifier string) func() {
	now := time.Now()
	logger.Infoln(identifier)
	log.Println(identifier)
	return func() {
		logger.Infoln(identifier, time.Since(now))
		log.Println(identifier, time.Since(now))
	}
}

func ParseDateString(v string) *time.Time {
	t, _ := time.Parse("2006-01-02T15:04:05+00:00", v)
	return &t
}
