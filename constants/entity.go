package constants

type Entity string

var Entities = struct {
	Manga,
	Chapter,
	Cover,

	Author,
	Artist,
	Group,
	User,

	Tag,
	CustomList Entity
}{
	"manga",
	"chapter",
	"cover_art",

	"author",
	"artist",
	"scanlation_group",
	"user",

	"tag",
	"custom_list",
}
