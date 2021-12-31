package prefs

import "github.com/spf13/viper"

type Authorization struct {
	SessionToken string `json:"sessionToken"`
	RefreshToken string `json:"refreshToken"`
}

var Auth = &Authorization{}

func (*Authorization) Save() {
	mutex.Lock()
	defer mutex.Unlock()

	viper.Set("auth", Auth)
	viper.WriteConfig()
}
