package mangaupdates

import (
	"fmt"
	"strings"

	"github.com/gocolly/colly/v2"
)

type (
	Release struct {
		Date  string
		Title string

		Chapter string
		Volume  string
		Groups  string
	}
)

// GetReleases retrieves latest releases
func GetReleases(id string) ([]*Release, error) {
	c := colly.NewCollector()

	var releases []*Release
	c.OnHTML("#main_content", func(e *colly.HTMLElement) {
		var release *Release
		columnIndex := 0

		e.ForEach(".text", func(i int, child *colly.HTMLElement) {
			classNames := strings.Split(child.Attr("class"), " ")
			if len(classNames) > 0 && !strings.HasPrefix(classNames[0], "col") {
				return
			}

			if release == nil {
				release = &Release{}
			}
			columnIndex++
			switch columnIndex {
			case 1:
				release.Date = child.Text
				break
			case 2:
				release.Title = child.Text
				break
			case 3:
				release.Volume = child.Text
				break
			case 4:
				release.Chapter = child.Text
				break
			case 5:
				release.Groups = child.Text
				releases = append(releases, release)
				release = nil
				columnIndex = 0
				break
			}
		})
	})

	return releases, c.Visit(fmt.Sprintf("https://www.mangaupdates.com/releases.html?search=%s&stype=series", id))
}
