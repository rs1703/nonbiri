package services

import (
	"nonbiri/models/tag"
	"nonbiri/utils"
	"sort"

	"github.com/rs1703/logger"
)

var tCache tag.Slice

func Tags() tag.Slice {
	defer logger.Track()()

	if len(tCache) == 0 {
		tCache = tag.All()
		sort.SliceStable(tCache, func(i, j int) bool {
			return utils.ASC(tCache[i].Name, tCache[j].Name)
		})
	}
	return tCache
}
