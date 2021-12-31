package database

import (
	"database/sql"
	_ "embed"
	"strings"
	"sync"

	"nonbiri/utils/logger"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sqlx.DB

var once = sync.Once{}

//go:embed schema.sql
var schema []byte

func init() {
	Init()
}

func Init() {
	once.Do(func() {
		var err error
		DB, err = sqlx.Open("sqlite3", "nonbiri-sqlite3.db?cache=shared&_journal=WAL")
		if err != nil {
			logger.UnexpectedFatal(err)
		}

		if err := DB.Ping(); err != nil {
			logger.UnexpectedFatal(err)
		}

		var count int
		if err := DB.Get(&count, "SELECT count(id) FROM manga"); err != nil {
			if strings.Contains(err.Error(), "no such table") {
				DB.MustExec(string(schema))
			} else {
				logger.UnexpectedFatal(err)
			}
		}
	})
}

type NamedExecFn func(query string, arg any) (sql.Result, error)

func NamedExec(tx *sqlx.Tx) (fn NamedExecFn) {
	fn = DB.NamedExec
	if tx != nil {
		fn = tx.NamedExec
	}
	return
}
