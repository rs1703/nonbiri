package prefs

import (
	. "nonbiri/constants"

	"github.com/spf13/viper"
)

type (
	ReaderPreference struct {
		// Sidebar
		ShowSidebar     bool            `json:"showSidebar"`
		SidebarPosition SidebarPosition `json:"sidebarPosition"`

		// Page
		NavigateOnClick bool          `json:"navigateOnClick"`
		Direction       PageDirection `json:"direction"`
		Scale           PageScale     `json:"scale"`
		MaxWidth        string        `json:"maxWidth"`
		MaxHeight       string        `json:"maxHeight"`
		Gaps            string        `json:"gaps"`
		Zoom            string        `json:"zoom"`

		// Download
		MaxPreloads int `json:"maxPreloads"`
		MaxParallel int `json:"maxParallel"`

		// Shortcuts
		Keybinds       Keybinds `json:"keybinds"`
		KeyScrollSpeed string   `json:"keyScrollSpeed"`
	}

	Keybinds struct {
		PreviousChapter string `json:"previousChapter"`
		NextChapter     string `json:"nextChapter"`
		PreviousPage    string `json:"previousPage"`
		NextPage        string `json:"nextPage"`
	}
)

var Reader = &ReaderPreference{
	ShowSidebar:     true,
	SidebarPosition: SidebarPositions.Left,

	NavigateOnClick: false,
	Direction:       PageDirections.TopToBottom,
	Scale:           PageScales.None,
	MaxWidth:        "1024",
	MaxHeight:       "0",
	Gaps:            "10",
	Zoom:            "1.0",

	MaxPreloads: 3,
	MaxParallel: 6,

	Keybinds: Keybinds{
		PreviousChapter: "Comma",
		NextChapter:     "Period",
		PreviousPage:    "ArrowLeft",
		NextPage:        "ArrowRight",
	},
	KeyScrollSpeed: "40",
}

func (*ReaderPreference) Update(new *ReaderPreference) {
	mutex.Lock()
	defer mutex.Unlock()

	*Reader = *new
	viper.Set("reader", Reader)
	viper.WriteConfig()
}
