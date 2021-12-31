package utils

import (
	"bytes"
	"encoding/json"
)

var nullBytes = []byte("null")
var emptySlice = []byte("[]")
var emptyObject = []byte("{}")

func ToBytes(v any) (buf []byte) {
	if v != nil {
		buf, _ = json.Marshal(v)
	}
	return
}

func ObjectToBytes(v any) ([]byte, error) {
	if v == nil {
		return emptyObject, nil
	}

	buf, err := Marshal(v)
	if err != nil || bytes.EqualFold(buf, nullBytes) {
		return emptyObject, err
	}

	return buf, nil
}

func SliceToBytes(v any) ([]byte, error) {
	if v == nil {
		return emptySlice, nil
	}

	buf, err := Marshal(v)
	if err != nil || bytes.EqualFold(buf, nullBytes) {
		return emptySlice, err
	}

	return buf, nil
}
