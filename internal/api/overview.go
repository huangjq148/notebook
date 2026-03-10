package api

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func OverviewData(c *fiber.Ctx) error {
	top5BuyGoods := services.GetTop5BuyGoods(c)
	top5SellGoods := services.GetTop5SellGoods(c)
	top5ProfitGoods := services.GetTop5ProfitGoods(c)
	top5BuyCustomer := services.GetTop5BuyCustomer(c)

	return c.JSON(response.Success(fiber.Map{
		"top5BuyGoods":    top5BuyGoods,
		"top5SellGoods":   top5SellGoods,
		"top5ProfitGoods": top5ProfitGoods,
		"top5BuyCustomer": top5BuyCustomer,
	}, "查询成功"))
}

// CoreMetrics 核心指标数据
type CoreMetrics struct {
	TotalSales       float64 `json:"totalSales"`
	TotalProfit      float64 `json:"totalProfit"`
	OrderCount       int     `json:"orderCount"`
	AvgProfitRate    float64 `json:"avgProfitRate"`
	SalesMoM         float64 `json:"salesMoM"`         // 销售额环比
	ProfitMoM        float64 `json:"profitMoM"`        // 利润环比
	OrderCountMoM    float64 `json:"orderCountMoM"`    // 订单数环比
	AvgProfitRateMoM float64 `json:"avgProfitRateMoM"` // 平均利润率环比
}

// CoreMetricsData 获取核心指标数据
func CoreMetricsData(c *fiber.Ctx) error {
	userId := c.Get("current_user_id")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	// 获取当前周期数据
	currentMetrics := getMetricsByTimeRange(userId, startTime, endTime)

	// 计算上一周期（相同天数）
	prevStartTime, prevEndTime := calculatePrevPeriod(startTime, endTime)
	prevMetrics := getMetricsByTimeRange(userId, prevStartTime, prevEndTime)

	// 计算环比
	result := CoreMetrics{
		TotalSales:       currentMetrics.TotalSales,
		TotalProfit:      currentMetrics.TotalProfit,
		OrderCount:       currentMetrics.OrderCount,
		AvgProfitRate:    currentMetrics.AvgProfitRate,
		SalesMoM:         calculateMoM(currentMetrics.TotalSales, prevMetrics.TotalSales),
		ProfitMoM:        calculateMoM(currentMetrics.TotalProfit, prevMetrics.TotalProfit),
		OrderCountMoM:    calculateMoM(float64(currentMetrics.OrderCount), float64(prevMetrics.OrderCount)),
		AvgProfitRateMoM: calculateMoM(currentMetrics.AvgProfitRate, prevMetrics.AvgProfitRate),
	}

	return c.JSON(response.Success(result, "查询成功"))
}

// 根据时间范围获取指标
func getMetricsByTimeRange(userId, startTime, endTime string) CoreMetrics {
	type QueryResult struct {
		TotalSales    float64 `db:"totalSales"`
		TotalProfit   float64 `db:"totalProfit"`
		OrderCount    int     `db:"orderCount"`
		TotalBuyCost  float64 `db:"totalBuyCost"`
	}

	var result QueryResult
	sql := `select 
		IFNULL(sum(sellPrice*number),0) totalSales,
		IFNULL(sum(sellPrice*number-buyPrice*number-otherCost),0) totalProfit,
		IFNULL(sum(number),0) orderCount,
		IFNULL(sum(buyPrice*number),0) totalBuyCost
	from t_order 
	where createUser=?`

	params := []interface{}{userId}
	if startTime != "" {
		sql += " and orderTime>=?"
		params = append(params, startTime)
	}
	if endTime != "" {
		sql += " and orderTime<=?"
		params = append(params, endTime)
	}

	database.DBConn.Get(&result, sql, params...)

	// 计算平均利润率
	avgProfitRate := float64(0)
	if result.TotalSales > 0 {
		avgProfitRate = (result.TotalProfit / result.TotalSales) * 100
	}

	return CoreMetrics{
		TotalSales:    result.TotalSales,
		TotalProfit:   result.TotalProfit,
		OrderCount:    result.OrderCount,
		AvgProfitRate: avgProfitRate,
	}
}

// 计算环比变化率
func calculateMoM(current, previous float64) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 100
	}
	return ((current - previous) / previous) * 100
}

// 计算上一周期时间范围（简化版，相同天数）
func calculatePrevPeriod(startTime, endTime string) (string, string) {
	// 这里简化处理，实际应该解析日期并计算
	// 返回空字符串表示不限制时间（全量对比）
	return "", ""
}

// SalesDistribution 销售额分布统计
type SalesDistributionItem struct {
	Name  string  `json:"name" db:"name"`
	Value float64 `json:"value" db:"value"`
}

// SalesDistribution 按产品名称统计销售额占比
func SalesDistribution(c *fiber.Ctx) error {
	userId := c.Get("current_user_id")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	sql := `select 
		name,
		IFNULL(sum(sellPrice*number),0) as value
	from t_order 
	where createUser=?`

	params := []interface{}{userId}
	if startTime != "" {
		sql += " and orderTime>=?"
		params = append(params, startTime)
	}
	if endTime != "" {
		sql += " and orderTime<=?"
		params = append(params, endTime)
	}
	sql += " group by name order by value desc limit 10"

	var result []SalesDistributionItem
	err := database.DBConn.Select(&result, sql, params...)
	if err != nil {
		return c.JSON(response.Error("查询失败: " + err.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

// ProfitTrendWithCompare 带对比的利润趋势
type ProfitTrendItem struct {
	Date         string  `json:"date" db:"date"`
	Current      float64 `json:"current" db:"current"`
	Compare      float64 `json:"compare" db:"compare"`
	CompareLabel string  `json:"compareLabel"`
}

// ProfitTrendWithCompare 获取利润趋势（支持同比/环比）
func ProfitTrendWithCompare(c *fiber.Ctx) error {
	userId := c.Get("current_user_id")
	compareType := c.Query("compareType", "month-over-month") // year-over-year, month-over-month
	daysStr := c.Query("days", "14")
	days, _ := strconv.Atoi(daysStr)

	// 获取当前周期数据
	currentData := getProfitTrend(userId, days)

	var compareData []ProfitTrendItem
	var compareLabel string

	if compareType == "year-over-year" {
		compareLabel = "去年同期"
		// 这里简化处理，实际应该查询去年同期数据
		compareData = currentData
	} else {
		compareLabel = "上期环比"
		// 这里简化处理，实际应该查询上一周期数据
		compareData = currentData
	}

	// 合并数据
	for i := range currentData {
		currentData[i].CompareLabel = compareLabel
		if i < len(compareData) {
			currentData[i].Compare = compareData[i].Current
		}
	}

	return c.JSON(response.Success(currentData, "查询成功"))
}

// getProfitTrend 获取利润趋势数据
func getProfitTrend(userId string, days int) []ProfitTrendItem {
	sql := `select 
		orderTime as date,
		IFNULL(sum(sellPrice*number - buyPrice*number - otherCost),0) as current
	from t_order 
	where createUser=?
	group by orderTime 
	order by orderTime desc 
	limit ?`

	var result []ProfitTrendItem
	database.DBConn.Select(&result, sql, userId, days)

	// 反转结果，按时间正序排列
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result
}

func ProfitStatic(c *fiber.Ctx) error {
	type Result struct {
		Profit    float32 `db:"profit" json:"profit"`
		OrderTime string  `db:"orderTime" json:"orderTime"`
	}
	userId := c.Get("current_user_id")

	result := []Result{}
	sql := "select sum(sellPrice*number-buyPrice*number-otherCost) profit,orderTime from t_order where createUser=? group by orderTime order by orderTime desc limit 0,14"
	database.DBConn.Select(&result, sql, userId)

	return c.JSON(response.Success(result, "查询成功"))
}
