package query_test

import (
	"testing"

	"nonbiri/utils/query"
)

type Example struct {
	Name    string `define:"name" default:"Hello world"`
	Name2   string `define:"name2" default:"Replace me"`
	Number  int    `define:"number,omitempty" min:"10" max:"100" default:"50"`
	Number2 int    `define:"number2,omitempty" min:"10" max:"100"`
	Number3 int    `define:"number3,omitempty" min:"10" max:"100"`
	Number4 int    `define:"number4,omitempty" min:"10" max:"100"`
	Number5 int    `define:"number5,omitempty"`

	FalseBool   bool   `define:"falseBool" default:"false"`
	TrueBool    bool   `define:"trueBool" default:"true"`
	Enum        string `enum:"a,b,c" default:"c"`
	Enum2       string `enum:"a,b,c" default:"e"`
	EmptyString string
	EmptyNumber int  `define:",omitempty"`
	EmptyBool   bool `define:",omitempty"`

	StringSlice []string `define:"stringSlice" enum:"a,b,c,d,e" default:"a,b,c"`
	Pair        Pair     `define:"pair[$],pair" default:"title,asc"`
	Pair2       Pair     `define:"pair2[$],pair" default:"title,asc"`
	Pair3       Pair     `define:"pair3[$],pair" default:"title,asc"`
	InvalidPair Pair     `define:"invalid[$],pair" default:"asdf,asdf"`
}

type Pair struct {
	Key   string `enum:"title,chapter,volume" default:"chapter"`
	Value string `enum:"asc,desc" default:"desc"`
}

func TestQueries(t *testing.T) {
	example := &Example{
		Name2:   "Replaced",
		Number2: 1,
		Number3: 101,
		Number4: 69,
		Number5: 2555,
		Pair3:   Pair{"volume", "desc"},
	}

	queries := query.Parse(example)
	t.Log(queries.Encode())
}
