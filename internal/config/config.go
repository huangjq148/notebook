package config

import (
	"os"
	"sync"

	"github.com/joho/godotenv"
)

var loadOnce sync.Once
var projectDBName string

// Config 获取环境变量值
//
// 只会尝试加载一次 .env（容器部署时通常直接注入环境变量），
// 项目 .env 中的 DB_NAME 优先，避免继承其他项目的库名。
// 其他配置仍优先使用环境变量。
func Config(key string) string {
	loadOnce.Do(func() {
		// 忽略错误：没有 .env 文件时直接使用系统环境变量
		values, _ := godotenv.Read(".env")
		projectDBName = values["DB_NAME"]
		_ = godotenv.Load(".env")
	})
	if key == "DB_NAME" && projectDBName != "" {
		return projectDBName
	}
	return os.Getenv(key)
}
