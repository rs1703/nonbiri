package constants

type Status int

var Statuses = struct {
	Ongoing,
	Completed,
	Cancelled,
	Hiatus Status
}{
	Ongoing:   1,
	Completed: 2,
	Cancelled: 3,
	Hiatus:    4,
}

func (self Status) String() string {
	switch self {
	case Statuses.Completed:
		return "completed"
	case Statuses.Cancelled:
		return "cancelled"
	case Statuses.Hiatus:
		return "hiatus"
	default:
		return "ongoing"
	}
}
