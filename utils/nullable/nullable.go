package nullable

import (
	"nonbiri/utils"
)

func scan(src any, v any) (err error) {
	if src != nil {
		err = utils.Unmarshal(src, v)
	}
	return
}

type Uint16 uint16

func (v *Uint16) Scan(src any) (err error) {
	return scan(src, v)
}

func (v *Uint16) Set(value uint16) {
	*v = Uint16(value)
}

type Bool bool

func (v *Bool) Scan(src any) (err error) {
	return scan(src, v)

}

func (v *Bool) Set(value bool) {
	*v = Bool(value)
}
