package manga

import (
	"database/sql/driver"

	"nonbiri/utils"
)

type Related struct {
	ID    string `json:"id"`
	Type  string `json:"type"`
	Title string `json:"title"`
}

type Relateds []*Related

func (s Relateds) Value() (driver.Value, error) {
	return utils.SliceToBytes(s)
}

func (s *Relateds) Scan(src any) error {
	return utils.Unmarshal(src, s)
}
