package utils

type NullableInt int

func (v *NullableInt) Scan(src any) (err error) {
	if src != nil {
		err = Unmarshal(src, v)
	}
	return
}

type NullableInt64 int64

func (v *NullableInt64) Scan(src any) (err error) {
	if src != nil {
		err = Unmarshal(src, v)
	}
	return
}
