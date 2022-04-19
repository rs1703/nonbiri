package query

import (
	"log"
	"math"
	"net/url"
	"reflect"
	"strconv"
	"strings"
	"unicode"

	"nonbiri/utils/reflector"
)

type Define struct {
	Name      string
	OmitEmpty bool
	IsPair    bool
}

// Parse transforms struct to url search params
// and parses custom tags within the fields.
//
// List of tags:
//  - define:"%name,omitempty,map|pair"
//  - enum:"value,..." - Only supports string
//  - default:"value..." - Supports string, int and bool
//  - min:"%d" - Min number
//  - max:"%d" - Max number or number of items within a slice
//
// String fields are omitempty by default.
// Only use omitempty when you want to omit empty int(0) and bool(false) fields.
func Parse(obj any) *url.Values {
	rt := reflect.TypeOf(obj)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
	}

	rv := reflect.ValueOf(obj)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}

	queries := &url.Values{}
	for i := 0; i < rt.NumField(); i++ {
		v := rv.Field(i)
		t := rt.Field(i)

		defines := getDefine(&t)
		enum := getEnum(&t)
		defaults := getDefault(&t)
		min := getMin(&t)
		max := getMax(&t)

		switch v.Kind() {
		case reflect.Int:
			n := int(v.Int())
			if len(defaults.Number) > 0 && n == 0 {
				n = defaults.Number[0]
			}
			if (defines.OmitEmpty && n == 0) || (len(enum.Number) > 0 && !numbersIncludes(enum.Number, n)) || n < min || n > max {
				break
			}
			queries.Set(defines.Name, strconv.Itoa(n))
			break

		case reflect.Bool:
			b := v.Bool()
			if len(defaults.Bool) > 0 && !b {
				b = defaults.Bool[0]
			}
			if defines.OmitEmpty && !b {
				break
			}
			queries.Set(defines.Name, strconv.FormatBool(b))
			break

		case reflect.String:
			str := v.String()
			if len(defaults.String) > 0 && len(str) == 0 {
				str = defaults.String[0]
			}
			if len(str) == 0 || (len(enum.String) > 0 && !stringsIncludes(enum.String, str)) {
				break
			}
			queries.Set(defines.Name, str)
			break

		case reflect.Array, reflect.Slice:
			var arr []string
			count := v.Len()
			for i := 0; i < count && i < max; i++ {
				arr = append(arr, v.Index(i).String())
			}
			if len(defaults.String) > 0 && len(arr) == 0 {
				arr = defaults.String
			}
			for _, str := range arr {
				if len(str) == 0 || (len(enum.String) > 0 && !stringsIncludes(enum.String, str)) {
					continue
				}
				queries.Add(defines.Name, str)
			}
			break

		case reflect.Struct:
			if defines.IsPair {
				k, v := makePair(v.Interface())
				if len(defaults.String) > 0 {
					if len(k) == 0 {
						k = defaults.String[0]
					}
					if len(v) == 0 && len(defaults.String) > 1 && len(defaults.String[1]) > 0 {
						v = defaults.String[1]
					}
				}
				if len(k) > 0 && len(v) > 0 {
					queries.Set(strings.ReplaceAll(defines.Name, "$", k), v)
				}
				break
			}

		default:
			log.Panic("Unhandled: ", v.Kind())
			break
		}
	}

	return queries
}

func getDefine(f *reflect.StructField) *Define {
	tag := &Define{Name: f.Name}
	if values := strings.Split(f.Tag.Get("define"), ","); len(values) > 0 {
		if len(values[0]) > 0 {
			tag.Name = values[0]
		}
		for _, v := range values[1:] {
			if v == "omitempty" {
				tag.OmitEmpty = true
			} else if v == "map" || v == "pair" {
				tag.IsPair = true
			}
		}
	}
	return tag
}

func getEnum(f *reflect.StructField) *reflector.Tag {
	return reflector.GetTag(f, "enum")
}

func getDefault(f *reflect.StructField) *reflector.Tag {
	return reflector.GetTag(f, "default")
}

func getMin(f *reflect.StructField) int {
	n := math.MaxInt
	if value := f.Tag.Get("min"); len(value) > 0 {
		n, _ = strconv.Atoi(value)
	}
	return n
}

func getMax(f *reflect.StructField) int {
	n := math.MaxInt
	if value := f.Tag.Get("max"); len(value) > 0 {
		n, _ = strconv.Atoi(value)
	}
	return n
}

func makePair(o any) (string, string) {
	rv := reflect.ValueOf(o)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	rt := reflect.TypeOf(o)
	if rt.Kind() == reflect.Ptr {
		rt = rt.Elem()
	}

	var key, val string
	for i := 0; i < 2 && i < rv.NumField(); i++ {
		v := rv.Field(i)
		t := rt.Field(i)

		enum := getEnum(&t)
		defaults := getDefault(&t)

		str := v.String()
		if len(defaults.String) > 0 && len(str) == 0 {
			str = defaults.String[0]
		}
		if len(str) == 0 || (len(enum.String) > 0 && !stringsIncludes(enum.String, str)) {
			continue
		}

		if i == 0 {
			key = str
		} else {
			val = str
		}
	}

	return key, val
}

func isNumber(str string) bool {
	isNumber := true
	for _, char := range str {
		if unicode.IsLetter(char) {
			isNumber = false
			break
		}
	}
	return isNumber
}

func stringsIncludes(slice []string, str string) bool {
	if slice != nil && len(slice) > 0 {
		for _, e := range slice {
			if e == str {
				return true
			}
		}
	}
	return false
}

func numbersIncludes(slice []int, n int) bool {
	if slice != nil && len(slice) > 0 {
		for _, e := range slice {
			if e == n {
				return true
			}
		}
	}
	return false
}
