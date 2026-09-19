package services

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"

	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
)

// CSVBOMPrefix 导出 csv 时写入的 BOM，用于 Excel 正确识别中文
const CSVBOMPrefix = "\ufeff"

// BuildExportCSV 导出整个数据库的业务数据（商品 -> 库存 -> 联系人 -> 订单）
//
// 采用 `table,data` 两列格式，data 为该行数据的 JSON（含 createUser，保留归属），
// 保证可以无损导回数据库。
func BuildExportCSV() ([]byte, error) {
	db := database.DBConn

	var lines [][]string

	var products []model.Product
	if err := db.Select(&products, "select * from t_product order by id"); err != nil {
		return nil, fmt.Errorf("导出商品数据失败: %w", err)
	}
	for _, item := range products {
		lines = append(lines, []string{"t_product", marshalRecord(item)})
	}

	var stocks []model.Stock
	if err := db.Select(&stocks, "select * from t_stock order by id"); err != nil {
		return nil, fmt.Errorf("导出库存数据失败: %w", err)
	}
	for _, item := range stocks {
		lines = append(lines, []string{"t_stock", marshalRecord(item)})
	}

	var contacts []model.Contact
	if err := db.Select(&contacts, "select * from t_contact order by id"); err != nil {
		return nil, fmt.Errorf("导出联系人数据失败: %w", err)
	}
	for _, item := range contacts {
		lines = append(lines, []string{"t_contact", marshalRecord(item)})
	}

	var orders []model.Order
	if err := db.Select(&orders, "select * from t_order order by id"); err != nil {
		return nil, fmt.Errorf("导出订单数据失败: %w", err)
	}
	for _, item := range orders {
		lines = append(lines, []string{"t_order", marshalRecord(item)})
	}

	var buf bytes.Buffer
	buf.WriteString(CSVBOMPrefix)
	writer := csv.NewWriter(&buf)
	_ = writer.Write([]string{"table", "data"})
	for _, line := range lines {
		_ = writer.Write(line)
	}
	writer.Flush()

	return buf.Bytes(), nil
}

func marshalRecord(data interface{}) string {
	result, err := json.Marshal(data)
	if err != nil {
		return "{}"
	}
	return string(result)
}
