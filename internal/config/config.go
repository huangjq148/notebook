package config

import (
	"os"
	"sync"

	"github.com/joho/godotenv"
)

var loadOnce sync.Once

// Config 获取环境变量值
//
// 只会尝试加载一次 .env（容器部署时通常直接注入环境变量），
// 且环境变量优先于 .env 中的值。
func Config(key string) string {
	loadOnce.Do(func() {
		// 忽略错误：没有 .env 文件时直接使用系统环境变量
		_ = godotenv.Load(".env")
	})
	return os.Getenv(key)
}
