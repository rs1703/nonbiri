package constants

type Order int

var Orders = struct {
	ASC,
	DESC Order
}{
	ASC:  1,
	DESC: 2,
}

func (self Order) String() string {
	switch self {
	case Orders.DESC:
		return "desc"
	default:
		return "asc"
	}
}
