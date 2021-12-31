package constants

type Language int

var Languages = struct {
	English,
	Japan,
	Chinese,
	Korean Language
}{
	English: 1,
	Japan:   2,
	Chinese: 3,
	Korean:  4,
}

func (self Language) String() string {
	switch self {
	case Languages.Japan:
		return "ja"
	case Languages.Chinese:
		return "zh"
	case Languages.Korean:
		return "ko"
	default:
		return "en"
	}
}
