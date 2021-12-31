package reflector

import (
	"reflect"
	"strconv"
	"strings"
)

type Tag struct {
	String []string
	Number []int
	Bool   []bool
}

func GetFieldByValueString(str string, o any) *reflect.StructField {
	rt, rv := tvOf(o)
	for i := 0; i < rv.NumField(); i++ {
		v := rv.Field(i)
		if v.String() == str {
			f := (*rt).Field(i)
			return &f
		}
	}
	return nil
}

func GetFieldByValueInt(n int, o any) *reflect.StructField {
	rt, rv := tvOf(o)
	for i := 0; i < rv.NumField(); i++ {
		v := rv.Field(i)
		if int(v.Int()) == n {
			f := (*rt).Field(i)
			return &f
		}
	}
	return nil
}

func GetFieldNameByValue(x any, o any) string {
	rt, rv := tvOf(o)
	var name string

	xt := reflect.TypeOf(x)
	if xt.Kind() == reflect.Ptr {
		xt = xt.Elem()
	}
	kind := xt.Kind()

	for i := 0; i < rv.NumField() && len(name) == 0; i++ {
		v := rv.Field(i)
		assign := false
		if kind == v.Kind() {
			switch kind {
			case reflect.String:
				assign = v.String() == x.(string)
				break

			case reflect.Int:
				assign = int(v.Int()) == x.(int)
				break
			}
		}
		if assign {
			name = (*rt).Field(i).Name
			break
		}
	}
	return name
}

func GetFieldNameByValueString(x string, o any) string {
	rt, rv := tvOf(o)
	var name string

	for i := 0; i < rv.NumField() && len(name) == 0; i++ {
		v := rv.Field(i)
		if v.Kind() == reflect.String && v.String() == x {
			name = (*rt).Field(i).Name
			break
		}
	}
	return name
}

func GetFieldNameByValueInt(x string, o any) string {
	rt, rv := tvOf(o)
	var name string

	for i := 0; i < rv.NumField() && len(name) == 0; i++ {
		v := rv.Field(i)
		if v.Kind() == reflect.String && v.String() == x {
			name = (*rt).Field(i).Name
			break
		}
	}
	return name
}

func GetTag(field *reflect.StructField, tagName string) *Tag {
	values := strings.Split(field.Tag.Get(tagName), ",")

	tag := &Tag{}
	for _, v := range values {
		if len(v) == 0 {
			continue
		}
		if n, err := strconv.Atoi(v); err == nil {
			tag.Number = append(tag.Number, n)
		} else if b, err := strconv.ParseBool(v); err == nil {
			tag.Bool = append(tag.Bool, b)
		} else {
			tag.String = append(tag.String, v)
		}
	}

	return tag
}

func tvOf(o any) (*reflect.Type, *reflect.Value) {
	rt := reflect.TypeOf(o)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
	}

	rv := reflect.ValueOf(o)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	return &rt, &rv
}
