// Package migrations 以内嵌方式提供数据库版本化迁移脚本。
//
// 迁移脚本使用 <版本>_<说明>.up.sql / <版本>_<说明>.down.sql 命名，
// 应用启动和 ./cmd/migrate 共用迁移脚本，运行时无需读取工作目录。
package migrations

import "embed"

// FS 包含 migrations 目录下的全部 SQL 迁移脚本。
//
//go:embed *.sql
var FS embed.FS
