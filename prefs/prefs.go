package prefs

import (
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"

	"nonbiri/utils"
	"nonbiri/utils/logger"
)

var mutex = sync.Mutex{}

func init() {
	viper.SetConfigName("nonbiri")
	viper.SetConfigType("json")
	viper.AddConfigPath(".")

	viper.SetDefault("browse", Browse)
	viper.SetDefault("library", Library)
	viper.SetDefault("reader", Reader)
	viper.SetDefault("auth", Auth)

	viper.SafeWriteConfig()
	if err := viper.ReadInConfig(); err != nil {
		logger.UnexpectedFatal(err)
	}

	utils.Unmarshal(viper.Get("browse"), Browse)
	utils.Unmarshal(viper.Get("library"), Library)
	utils.Unmarshal(viper.Get("reader"), Reader)
	viper.SetDefault("auth", Auth)

	viper.OnConfigChange(func(fsnotify.Event) {
		utils.Unmarshal(viper.Get("browse"), Browse)
		utils.Unmarshal(viper.Get("library"), Library)
		utils.Unmarshal(viper.Get("reader"), Reader)
	})
	viper.WatchConfig()
}
