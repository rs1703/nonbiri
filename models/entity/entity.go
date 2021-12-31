package entity

import (
	"database/sql/driver"

	"nonbiri/utils"
)

type Entity struct {
	ID   string `json:"id"`
	Name string `json:"name,omitempty"`
}

type Slice []*Entity

func (s Slice) Value() (driver.Value, error) {
	return utils.SliceToBytes(s)
}

func (s *Slice) Scan(src any) error {
	return utils.Unmarshal(src, s)
}
