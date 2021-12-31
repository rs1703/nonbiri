package tag

import (
	"database/sql"

	. "nonbiri/constants"
	. "nonbiri/database"
	"nonbiri/utils/logger"

	"nonbiri/models/entity"
)

type Tag entity.Entity
type Slice entity.Slice

func All() (result Slice) {
	if err := DB.Select(&result, "SELECT * FROM tag"); err != nil {
		logger.Unexpected(err)
	}
	return
}

func One(name string) (result *Tag, err error) {
	result = &Tag{}
	if err = DB.Get(result, "SELECT * FROM tag WHERE name = ?", name); err == sql.ErrNoRows {
		err = ErrTagNotFound
	}
	return
}

func (t *Tag) Save() (sql.Result, error) {
	return DB.NamedExec("INSERT OR REPLACE INTO tag VALUES (:id, :name)", t)
}
