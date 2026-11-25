package api

import (
	"fmt"
	"math"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/services"
	"hjq-notebook/internal/utils"
)

const overviewDateFormat = "2006-01-02"

// overviewRange accepts the legacy parameter names used by the rankings too.
func overviewRange(c *fiber.Ctx) (time.Time, time.Time, error) {
	now := time.Now()
	startText := c.Query("startTime", c.Query("startOrderTime", now.Format("2006-01")+"-01"))
	endText := c.Query("endTime", c.Query("endOrderTime", now.Format(overviewDateFormat)))
	start, err := time.Parse(overviewDateFormat, startText)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("开始日期格式应为 YYYY-MM-DD")
	}
	end, err := time.Parse(overviewDateFormat, endText)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("结束日期格式应为 YYYY-MM-DD")
	}
	if end.Before(start) || end.Sub(start).Hours()/24 > 3660 {
		return time.Time{}, time.Time{}, fmt.Errorf("请选择有效日期范围（最多十年）")
	}
	return start, end, nil
}

func OverviewData(c *fiber.Ctx) error {
	start, end, err := overviewRange(c)
	if err != nil {
		return c.Status(400).JSON(response.Error(err.Error()))
	}
	// Keep the rankings on exactly the same range as the other overview endpoints.
	c.Request().URI().QueryArgs().Set("startOrderTime", start.Format(overviewDateFormat))
	c.Request().URI().QueryArgs().Set("endOrderTime", end.Format(overviewDateFormat))
	buy, err := services.GetTop5BuyGoods(c)
	if err != nil {
		return c.Status(500).JSON(response.Error("排行榜查询失败"))
	}
	sell, err := services.GetTop5SellGoods(c)
	if err != nil {
		return c.Status(500).JSON(response.Error("排行榜查询失败"))
	}
	profit, err := services.GetTop5ProfitGoods(c)
	if err != nil {
		return c.Status(500).JSON(response.Error("排行榜查询失败"))
	}
	customer, err := services.GetTop5BuyCustomer(c)
	if err != nil {
		return c.Status(500).JSON(response.Error("排行榜查询失败"))
	}
	return c.JSON(response.Success(fiber.Map{"top5BuyGoods": buy, "top5SellGoods": sell, "top5ProfitGoods": profit, "top5BuyCustomer": customer}, "查询成功"))
}

type CoreMetrics struct {
	TotalSales       float64  `json:"totalSales" db:"totalSales"`
	TotalProfit      float64  `json:"totalProfit" db:"totalProfit"`
	OrderCount       int      `json:"orderCount" db:"orderCount"`
	AvgProfitRate    float64  `json:"avgProfitRate"`
	SalesMoM         *float64 `json:"salesMoM"`
	ProfitMoM        *float64 `json:"profitMoM"`
	OrderCountMoM    *float64 `json:"orderCountMoM"`
	AvgProfitRateMoM *float64 `json:"avgProfitRateMoM"`
	PreviousStart    string   `json:"previousStart"`
	PreviousEnd      string   `json:"previousEnd"`
}

func CoreMetricsData(c *fiber.Ctx) error {
	start, end, err := overviewRange(c)
	if err != nil {
		return c.Status(400).JSON(response.Error(err.Error()))
	}
	userID := utils.GetUserId(c)
	result, err := getMetricsByTimeRange(userID, start.Format(overviewDateFormat), end.Format(overviewDateFormat))
	if err != nil {
		return c.Status(500).JSON(response.Error("核心指标查询失败"))
	}
	prevStart, prevEnd := calculatePrevPeriod(start.Format(overviewDateFormat), end.Format(overviewDateFormat))
	prev, err := getMetricsByTimeRange(userID, prevStart, prevEnd)
	if err != nil {
		return c.Status(500).JSON(response.Error("对比指标查询失败"))
	}
	result.SalesMoM = calculateMoM(result.TotalSales, prev.TotalSales)
	result.ProfitMoM = calculateMoM(result.TotalProfit, prev.TotalProfit)
	result.OrderCountMoM = calculateMoM(float64(result.OrderCount), float64(prev.OrderCount))
	if result.TotalSales > 0 && prev.TotalSales > 0 {
		delta := result.AvgProfitRate - prev.AvgProfitRate
		result.AvgProfitRateMoM = &delta // Percentage points, not relative percent.
	}
	result.PreviousStart, result.PreviousEnd = prevStart, prevEnd
	return c.JSON(response.Success(result, "查询成功"))
}

func getMetricsByTimeRange(userID, start, end string) (CoreMetrics, error) {
	var result CoreMetrics
	err := database.DBConn.Get(&result, `select
 COALESCE(sum(sellPrice*number),0) totalSales,
 COALESCE(sum(sellPrice*number-buyPrice*number-COALESCE(otherCost,0)),0) totalProfit,
 count(*) orderCount
 from t_order where createUser=? and orderTime>=? and orderTime<=?`, userID, start, end)
	if result.TotalSales > 0 {
		result.AvgProfitRate = result.TotalProfit / result.TotalSales * 100
	}
	return result, err
}

func calculateMoM(current, previous float64) *float64 {
	if previous == 0 {
		return nil
	}
	value := (current - previous) / math.Abs(previous) * 100
	return &value
}

func calculatePrevPeriod(startText, endText string) (string, string) {
	start, err := time.Parse(overviewDateFormat, startText)
	if err != nil {
		return "", ""
	}
	end, err := time.Parse(overviewDateFormat, endText)
	if err != nil || end.Before(start) {
		return "", ""
	}
	days := int(end.Sub(start).Hours()/24) + 1
	return start.AddDate(0, 0, -days).Format(overviewDateFormat), start.AddDate(0, 0, -1).Format(overviewDateFormat)
}

type SalesDistributionItem struct {
	Name  string  `json:"name" db:"name"`
	Value float64 `json:"value" db:"value"`
}

func SalesDistribution(c *fiber.Ctx) error {
	start, end, err := overviewRange(c)
	if err != nil {
		return c.Status(400).JSON(response.Error(err.Error()))
	}
	result := []SalesDistributionItem{}
	err = database.DBConn.Select(&result, `select COALESCE(name,'') name, COALESCE(sum(sellPrice*number),0) value
 from t_order where createUser=? and orderTime>=? and orderTime<=?
 group by name order by value desc limit 10`, utils.GetUserId(c), start.Format(overviewDateFormat), end.Format(overviewDateFormat))
	if err != nil {
		return c.Status(500).JSON(response.Error("销售分布查询失败"))
	}
	return c.JSON(response.Success(result, "查询成功"))
}

type ProfitTrendItem struct {
	Date         string  `json:"date" db:"date"`
	Current      float64 `json:"current" db:"current"`
	Compare      float64 `json:"compare"`
	CompareLabel string  `json:"compareLabel"`
}

func getProfitTrend(userID string, start, end time.Time) ([]ProfitTrendItem, error) {
	rows := []ProfitTrendItem{}
	err := database.DBConn.Select(&rows, `select orderTime as date,
 COALESCE(sum(sellPrice*number-buyPrice*number-COALESCE(otherCost,0)),0) as current
 from t_order where createUser=? and orderTime>=? and orderTime<=?
 group by orderTime order by orderTime asc`, userID, start.Format(overviewDateFormat), end.Format(overviewDateFormat))
	if err != nil {
		return nil, err
	}
	return fillProfitDates(rows, start, end), nil
}

func fillProfitDates(rows []ProfitTrendItem, start, end time.Time) []ProfitTrendItem {
	byDate := map[string]float64{}
	for _, row := range rows {
		byDate[row.Date] = row.Current
	}
	result := []ProfitTrendItem{}
	for day := start; !day.After(end); day = day.AddDate(0, 0, 1) {
		date := day.Format(overviewDateFormat)
		result = append(result, ProfitTrendItem{Date: date, Current: byDate[date]})
	}
	return result
}

func ProfitTrendWithCompare(c *fiber.Ctx) error {
	start, end, err := overviewRange(c)
	if err != nil {
		return c.Status(400).JSON(response.Error(err.Error()))
	}
	if c.Query("days") != "" {
		days, err := strconv.Atoi(c.Query("days"))
		if err != nil || days < 1 || days > 3660 {
			return c.Status(400).JSON(response.Error("天数应为 1 到 3660"))
		}
		start = end.AddDate(0, 0, 1-days)
	}
	compareType := c.Query("compareType", "month-over-month")
	if compareType != "month-over-month" && compareType != "year-over-year" {
		return c.Status(400).JSON(response.Error("不支持的对比类型"))
	}
	userID := utils.GetUserId(c)
	current, err := getProfitTrend(userID, start, end)
	if err != nil {
		return c.Status(500).JSON(response.Error("利润趋势查询失败"))
	}
	prevStart, prevEnd := start.AddDate(0, 0, -len(current)), start.AddDate(0, 0, -1)
	label := "上一等长周期"
	if compareType == "year-over-year" {
		// Query the prior year, then align by calendar date (Feb 29 uses Feb 28).
		prevStart, prevEnd = priorYearDate(start), priorYearDate(end)
		label = "去年同期"
	}
	previous, err := getProfitTrend(userID, prevStart, prevEnd)
	if err != nil {
		return c.Status(500).JSON(response.Error("对比趋势查询失败"))
	}
	byDate := map[string]float64{}
	for _, item := range previous {
		byDate[item.Date] = item.Current
	}
	for i := range current {
		day := start.AddDate(0, 0, i)
		comparisonDay := prevStart.AddDate(0, 0, i)
		if compareType == "year-over-year" {
			comparisonDay = priorYearDate(day)
		}
		current[i].Compare = byDate[comparisonDay.Format(overviewDateFormat)]
		current[i].CompareLabel = label
	}
	return c.JSON(response.Success(current, "查询成功"))
}

func priorYearDate(day time.Time) time.Time {
	year, month, date := day.Date()
	if month == time.February && date == 29 {
		date = 28
	}
	return time.Date(year-1, month, date, 0, 0, 0, 0, day.Location())
}

// ProfitStatic retains the legacy response shape while using 14 calendar days.
func ProfitStatic(c *fiber.Ctx) error {
	end, _ := time.Parse(overviewDateFormat, time.Now().Format(overviewDateFormat))
	rows, err := getProfitTrend(utils.GetUserId(c), end.AddDate(0, 0, -13), end)
	if err != nil {
		return c.Status(500).JSON(response.Error("利润趋势查询失败"))
	}
	result := []fiber.Map{}
	for _, row := range rows {
		result = append(result, fiber.Map{"orderTime": row.Date, "profit": row.Current})
	}
	return c.JSON(response.Success(result, "查询成功"))
}
