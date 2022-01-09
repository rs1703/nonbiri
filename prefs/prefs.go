package prefs

import (
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/rs1703/logger"
	"github.com/spf13/viper"

	"nonbiri/utils"
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
		logger.Err.Fatalln(err)
	}

	mutex.Lock()
	utils.Unmarshal(viper.Get("browse"), Browse)
	utils.Unmarshal(viper.Get("library"), Library)
	utils.Unmarshal(viper.Get("reader"), Reader)
	utils.Unmarshal(viper.Get("auth"), Auth)
	mutex.Unlock()

	viper.OnConfigChange(func(fsnotify.Event) {
		mutex.Lock()
		utils.Unmarshal(viper.Get("browse"), Browse)
		utils.Unmarshal(viper.Get("library"), Library)
		utils.Unmarshal(viper.Get("reader"), Reader)
		utils.Unmarshal(viper.Get("auth"), Auth)
		mutex.Unlock()
	})
	viper.WatchConfig()
}
