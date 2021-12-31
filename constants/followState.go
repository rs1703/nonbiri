package constants

type FollowState int

var FollowStates = struct {
	None,
	Reading,
	Planning,
	Completed,
	Dropped FollowState
}{
	None:      0,
	Reading:   1,
	Planning:  2,
	Completed: 3,
	Dropped:   4,
}
