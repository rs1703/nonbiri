package main

import (
	"flag"

	"nonbiri/database"
	_ "nonbiri/handlers"
	_ "nonbiri/prefs"
	"nonbiri/services"

	"nonbiri/scrapers/mangadex"

	"github.com/rs1703/logger"
)

var Build string
var Version = "develop"
var Mode string

func init() {
	modePtr := flag.String("mode", "release", "")
	flag.Parse()
	Mode = *modePtr

	logger.SetOutput("nonbiri.log")
}

func main() {
	database.Init()

	// Retrieves tags from mangadex
	tags, err := mangadex.TagsEx()
	if err != nil {
		logger.Err.Fatalln(err)
	}

	for _, tag := range tags {
		if _, err := tag.Save(); err != nil {
			logger.Err.Fatalln(err)
		}
	}

	// Prepare cache
	services.Tags()
	services.Library(true)
	services.Updates(true)
	go services.ScheduleUpdate()

	StartServer()
}
