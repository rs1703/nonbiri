package manga

import (
	"database/sql/driver"
	"nonbiri/utils"
)

type Tags []string

func (t Tags) Value() (driver.Value, error) {
	return utils.SliceToBytes(t)
}

func (t *Tags) Scan(src any) error {
	return utils.Unmarshal(src, t)

}
