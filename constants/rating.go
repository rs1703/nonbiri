package constants

type Rating int

var Ratings = struct {
	Safe,
	Suggestive,
	Erotica,
	Pornographic Rating
}{
	Safe:         1,
	Suggestive:   2,
	Erotica:      3,
	Pornographic: 4,
}

func (self Rating) String() string {
	switch self {
	case Ratings.Suggestive:
		return "suggestive"
	case Ratings.Erotica:
		return "erotica"
	case Ratings.Pornographic:
		return "pornographic"
	default:
		return "safe"
	}
}
