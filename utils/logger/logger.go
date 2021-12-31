package logger

import (
	"log"
	"os"
)

var e = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
var i = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

var Infoln = i.Println
var Errorln = e.Println
var Fatalln = e.Fatalln

func init() {
	file, err := os.OpenFile("nonbiri.log", os.O_APPEND|os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		log.Fatalln(err.Error())
	}

	e.SetOutput(file)
	i.SetOutput(file)
}

func Unexpected(err error) {
	e.Println("Unexpected error:", err)
}

func UnexpectedFatal(err error) {
	e.Fatalln("Unexpected error:", err)
}
