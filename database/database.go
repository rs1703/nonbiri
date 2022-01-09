package database

import (
	"database/sql"
	_ "embed"
	"sync"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs1703/logger"
)

var DB *sqlx.DB
var once = sync.Once{}

//go:embed schema.sql
var schema []byte

func Init() {
	once.Do(func() {
		var err error
		DB, err = sqlx.Open("sqlite3", "nonbiri.db?cache=shared&_journal=WAL")
		if err != nil {
			logger.Err.Fatalln(err)
		}

		if err := DB.Ping(); err != nil {
			logger.Err.Fatalln(err)
		}
		DB.MustExec(string(schema))
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
