package utils

import (
	"time"
)

func ParseDateString(v string) *time.Time {
	t, _ := time.Parse("2006-01-02T15:04:05+00:00", v)
	return &t
}
