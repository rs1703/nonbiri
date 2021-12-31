package utils

import "encoding/json"

func Unmarshal(v any, dest any) error {
	buf, err := Marshal(v)
	if err != nil {
		return err
	}
	return json.Unmarshal(buf, dest)
}

func Marshal(v any) ([]byte, error) {
	switch v := v.(type) {
	case []byte:
		return v, nil
	case string:
		return []byte(v), nil
	}
	return json.Marshal(v)
}

func MarshalIndent(v any) ([]byte, error) {
	switch v := v.(type) {
	case []byte:
		return v, nil
	case string:
		return []byte(v), nil
	}
	return json.MarshalIndent(v, "", "  ")
}
