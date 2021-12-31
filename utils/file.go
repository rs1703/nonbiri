package utils

import (
	"io"
	"io/ioutil"
	"os"
)

func ReadFile(filePath string) ([]byte, error) {
	return ioutil.ReadFile(filePath)
}

func WriteFile(buf []byte, outputPath string) error {
	return ioutil.WriteFile(outputPath, buf, 0644)
}

func WriteReader(r io.Reader, outputPath string) error {
	buf, err := ioutil.ReadAll(r)
	if err != nil {
		return err
	}
	return WriteFile(buf, outputPath)
}

func IsFileExists(filePath string) bool {
	info, err := os.Stat(filePath)
	return !os.IsNotExist(err) && !info.IsDir()
}

func IsDirExists(dirPath string) bool {
	info, err := os.Stat(dirPath)
	return !os.IsNotExist(err) && info.IsDir()
}
