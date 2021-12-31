package constants

type PageDirection int

var PageDirections = struct {
	TopToBottom,
	RightToLeft,
	LeftToRight PageDirection
}{
	TopToBottom: 1,
	RightToLeft: 2,
	LeftToRight: 3,
}

type PageScale int

var PageScales = struct {
	None,
	Original,
	Width,
	Height,
	Stretch,
	FitWidth,
	FitHeight,
	StretchWidth,
	StretchHeight PageScale
}{
	None:          0,
	Original:      1,
	Width:         2,
	Height:        3,
	Stretch:       4,
	FitWidth:      5,
	FitHeight:     6,
	StretchWidth:  7,
	StretchHeight: 8,
}

type SidebarPosition int

var SidebarPositions = struct {
	Left,
	Right SidebarPosition
}{
	Left:  1,
	Right: 2,
}
