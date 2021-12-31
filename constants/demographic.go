package constants

type Demographic int

var Demographics = struct {
	Josei,
	Seinen,
	Shoujo,
	Shounen Demographic
}{
	Josei:   1,
	Seinen:  2,
	Shoujo:  3,
	Shounen: 4,
}

func (self Demographic) String() string {
	switch self {
	case Demographics.Seinen:
		return "seinen"
	case Demographics.Shoujo:
		return "shoujo"
	case Demographics.Shounen:
		return "shounen"
	default:
		return "josei"
	}
}
