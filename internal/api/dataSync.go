package api

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strings"
	"time"

	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/services"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// 数据同步（导入 / 导出）
//
// 为了把多张表的数据放进同一个 csv 文件，同时保证可以无损导回数据库，
// 这里采用 `table,data` 两列格式：table 为表名，data 为该行数据的 JSON。
// 导出顺序固定为：商品 -> 库存 -> 联系人 -> 订单，便于阅读和排查。

const (
	csvHeaderTable = "table"
	csvHeaderData  = "data"
)

// ExportData 导出整个数据库的业务数据到一个 csv 文件中
func ExportData(c *fiber.Ctx) error {
	content, err := services.BuildExportCSV()
	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	filename := fmt.Sprintf("data-sync-%s.csv", time.Now().Format("20060102-150405"))
	c.Set(fiber.HeaderContentType, "text/csv; charset=utf-8")
	c.Set(fiber.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s"`, filename))

	return c.Send(content)
}

// SendDataSyncMail 手动将整个数据库的数据备份发送到配置的邮箱
func SendDataSyncMail(c *fiber.Ctx) error {
	if err := services.RunDataSyncMail(); err != nil {
		return c.JSON(response.Error("发送失败: " + err.Error()))
	}

	return c.JSON(response.Success(nil, "已发送到邮箱"))
}

// GetDataSyncMailConfig 获取数据同步邮件配置（授权码不回传）
func GetDataSyncMailConfig(c *fiber.Ctx) error {
	cfg, err := services.LoadDataSyncConfig()
	if err != nil {
		return c.JSON(response.Error("读取配置失败: " + err.Error()))
	}

	return c.JSON(response.Success(fiber.Map{
		"id":           cfg.Id,
		"isEnable":     cfg.IsEnable,
		"mailUsername": cfg.MailUsername,
		"mailFrom":     cfg.MailFrom,
		"mailTo":       cfg.MailTo,
		"mailHost":     cfg.MailHost,
		"mailPort":     cfg.MailPort,
		"sendHour":     cfg.SendHour,
		"hasAuthCode":  cfg.MailAuthCode != "",
	}, "查询成功"))
}

// SaveDataSyncMailConfig 保存数据同步邮件配置
func SaveDataSyncMailConfig(c *fiber.Ctx) error {
	var cfg model.DataSyncConfig

	if err := c.BodyParser(&cfg); err != nil {
		return c.JSON(response.Error("参数格式错误"))
	}

	if cfg.SendHour < 0 || cfg.SendHour > 23 {
		return c.JSON(response.Error("发送时间必须在 0-23 之间"))
	}

	if cfg.IsEnable != "1" {
		cfg.IsEnable = "0"
	}

	if err := services.SaveDataSyncConfig(cfg); err != nil {
		return c.JSON(response.Error("保存失败: " + err.Error()))
	}

	return c.JSON(response.Success(nil, "保存成功"))
}

// ImportData 将导出的 csv 文件导入到数据库
//
// 导入会覆盖 csv 涉及表的全部数据（未出现在 csv 中的表保持不变），为整体恢复操作。
// 记录会重新生成主键，保留原有 createUser 归属，并自动修复订单与库存之间的引用关系。
func ImportData(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.JSON(response.Error("请选择要导入的 CSV 文件"))
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.JSON(response.Error("读取文件失败"))
	}
	defer file.Close()

	raw, err := io.ReadAll(file)
	if err != nil {
		return c.JSON(response.Error("读取文件失败"))
	}

	content := strings.TrimPrefix(string(raw), services.CSVBOMPrefix)
	content = strings.TrimPrefix(content, "\ufeff")

	reader := csv.NewReader(strings.NewReader(content))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	records, err := reader.ReadAll()
	if err != nil {
		return c.JSON(response.Error("CSV 解析失败: " + err.Error()))
	}
	if len(records) == 0 {
		return c.JSON(response.Error("CSV 内容为空"))
	}

	var (
		products []model.Product
		stocks   []model.Stock
		contacts []model.Contact
		orders   []model.Order
	)
	touched := map[string]bool{}

	start := 0
	if len(records[0]) >= 2 && (records[0][0] == csvHeaderTable || records[0][0] == "__table") {
		start = 1
	}

	for i := start; i < len(records); i++ {
		row := records[i]
		if len(row) < 2 {
			continue
		}

		table := strings.TrimSpace(row[0])
		data := strings.TrimSpace(row[1])
		if table == "" || data == "" {
			continue
		}

		switch table {
		case "t_product", "product":
			var item model.Product
			if err := json.Unmarshal([]byte(data), &item); err != nil {
				return c.JSON(response.Error(fmt.Sprintf("第 %d 行商品数据解析失败: %s", i+1, err.Error())))
			}
			products = append(products, item)
			touched["product"] = true
		case "t_stock", "stock":
			var item model.Stock
			if err := json.Unmarshal([]byte(data), &item); err != nil {
				return c.JSON(response.Error(fmt.Sprintf("第 %d 行库存数据解析失败: %s", i+1, err.Error())))
			}
			stocks = append(stocks, item)
			touched["stock"] = true
		case "t_contact", "contact":
			var item model.Contact
			if err := json.Unmarshal([]byte(data), &item); err != nil {
				return c.JSON(response.Error(fmt.Sprintf("第 %d 行联系人数据解析失败: %s", i+1, err.Error())))
			}
			contacts = append(contacts, item)
			touched["contact"] = true
		case "t_order", "order":
			var item model.Order
			if err := json.Unmarshal([]byte(data), &item); err != nil {
				return c.JSON(response.Error(fmt.Sprintf("第 %d 行订单数据解析失败: %s", i+1, err.Error())))
			}
			orders = append(orders, item)
			touched["order"] = true
		}
	}

	if len(products)+len(stocks)+len(contacts)+len(orders) == 0 {
		return c.JSON(response.Error("CSV 中没有可导入的数据"))
	}

	tx, err := database.DBConn.Beginx()
	if err != nil {
		return c.JSON(response.Error("开启事务失败: " + err.Error()))
	}
	defer func() { _ = tx.Rollback() }()

	now := utils.GetNow()

	// 整体恢复：先清空 csv 涉及表的数据
	if touched["order"] {
		if _, err := tx.Exec("delete from t_order"); err != nil {
			return c.JSON(response.Error("清理旧订单数据失败: " + err.Error()))
		}
	}
	if touched["contact"] {
		if _, err := tx.Exec("delete from t_contact"); err != nil {
			return c.JSON(response.Error("清理旧联系人数据失败: " + err.Error()))
		}
	}
	if touched["stock"] {
		if _, err := tx.Exec("delete from t_stock"); err != nil {
			return c.JSON(response.Error("清理旧库存数据失败: " + err.Error()))
		}
	}
	if touched["product"] {
		if _, err := tx.Exec("delete from t_product"); err != nil {
			return c.JSON(response.Error("清理旧商品数据失败: " + err.Error()))
		}
	}

	// 商品
	for _, item := range products {
		createTime, updateTime := syncTimes(item.CreateInfo, now)
		if _, err := tx.Exec(
			"insert into t_product(name,buyPrice,sellPrice,createUser,updateUser,createTime,updateTime) values(?,?,?,?,?,?,?)",
			item.Name, item.BuyPrice, item.SellPrice, createUserOf(item.CreateInfo), updateUserOf(item.CreateInfo), createTime, updateTime,
		); err != nil {
			return c.JSON(response.Error("导入商品数据失败: " + err.Error()))
		}
	}

	// 库存
	stockIdMap := map[int]int{}
	for _, item := range stocks {
		createTime, updateTime := syncTimes(item.CreateInfo, now)
		result, err := tx.Exec(
			"insert into t_stock(name,buyPrice,sellPrice,number,createUser,updateUser,createTime,updateTime) values(?,?,?,?,?,?,?,?)",
			item.Name, item.BuyPrice, item.SellPrice, item.Number, createUserOf(item.CreateInfo), updateUserOf(item.CreateInfo), createTime, updateTime,
		)
		if err != nil {
			return c.JSON(response.Error("导入库存数据失败: " + err.Error()))
		}
		if newId, err := result.LastInsertId(); err == nil {
			stockIdMap[item.Id] = int(newId)
		}
	}

	// 联系人
	for _, item := range contacts {
		createTime, updateTime := syncTimes(item.CreateInfo, now)
		if _, err := tx.Exec(
			"insert into t_contact(realname,phone,address,createUser,updateUser,createTime,updateTime) values(?,?,?,?,?,?,?)",
			item.Name, item.Phone, item.Address, createUserOf(item.CreateInfo), updateUserOf(item.CreateInfo), createTime, updateTime,
		); err != nil {
			return c.JSON(response.Error("导入联系人数据失败: " + err.Error()))
		}
	}

	// 订单（修复库存引用）
	for _, item := range orders {
		createTime, updateTime := syncTimes(item.CreateInfo, now)
		stockId := item.StockId
		if mapped, ok := stockIdMap[item.StockId]; ok {
			stockId = mapped
		}
		if _, err := tx.Exec(
			"insert into t_order(name,contact,address,phone,buyPrice,sellPrice,number,otherCost,remark,status,stockId,orderTime,createUser,updateUser,createTime,updateTime) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
			item.Name, item.Contact, item.Address, item.Phone, item.BuyPrice, item.SellPrice, item.Number,
			item.OtherCost, item.Remark, item.Status, stockId, item.OrderTime, createUserOf(item.CreateInfo), updateUserOf(item.CreateInfo), createTime, updateTime,
		); err != nil {
			return c.JSON(response.Error("导入订单数据失败: " + err.Error()))
		}
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(response.Error("提交数据失败: " + err.Error()))
	}

	return c.JSON(response.Success(fiber.Map{
		"product": len(products),
		"stock":   len(stocks),
		"contact": len(contacts),
		"order":   len(orders),
	}, "导入成功"))
}

// createUserOf 读取记录归属用户，缺失时返回 0
func createUserOf(info *model.CreateInfo) int {
	if info == nil {
		return 0
	}
	return info.CreateUser
}

// updateUserOf 读取记录最后修改人，缺失时返回 0
func updateUserOf(info *model.CreateInfo) int {
	if info == nil || info.UpdateUser == nil {
		return 0
	}
	return *info.UpdateUser
}

// syncTimes 优先保留 csv 中的创建/更新时间，缺失时使用当前时间
func syncTimes(info *model.CreateInfo, now string) (string, string) {
	createTime := now
	updateTime := now
	if info == nil {
		return createTime, updateTime
	}
	if info.CreateTime != nil && *info.CreateTime != "" {
		createTime = *info.CreateTime
	}
	if info.UpdateTime != nil && *info.UpdateTime != "" {
		updateTime = *info.UpdateTime
	}
	return createTime, updateTime
}
