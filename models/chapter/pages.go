package chapter

import (
	"database/sql/driver"

	"nonbiri/utils"
)

type Pages []string

func (p Pages) Value() (driver.Value, error) {
	return utils.SliceToBytes(p)
}

func (p *Pages) Scan(src any) error {
	return utils.Unmarshal(src, p)
}
