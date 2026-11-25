package api

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
)

func TestPreviousPeriod(t *testing.T) {
	for _, tc := range []struct{ start, end, wantStart, wantEnd string }{
		{"2026-11-18", "2026-11-18", "2026-11-17", "2026-11-17"},
		{"2026-11-01", "2026-11-18", "2026-10-14", "2026-10-31"},
		{"2024-03-01", "2024-03-31", "2024-01-30", "2024-02-29"},
		{"2026-01-01", "2026-01-07", "2025-12-25", "2025-12-31"},
	} {
		start, end := calculatePrevPeriod(tc.start, tc.end)
		if start != tc.wantStart || end != tc.wantEnd {
			t.Errorf("%s..%s: got %s..%s, want %s..%s", tc.start, tc.end, start, end, tc.wantStart, tc.wantEnd)
		}
	}
}

func TestMetricChange(t *testing.T) {
	for _, tc := range []struct{ current, previous, want float64 }{
		{150, 100, 50}, {50, 100, -50}, {-50, -100, 50}, {-150, -100, -50}, {0, 100, -100}, {100, 100, 0},
	} {
		got := calculateMoM(tc.current, tc.previous)
		if got == nil || *got != tc.want {
			t.Errorf("change(%v,%v) = %v, want %v", tc.current, tc.previous, got, tc.want)
		}
	}
	for _, value := range []float64{0, 100, -100} {
		if calculateMoM(value, 0) != nil {
			t.Error("zero baseline must have no comparable percentage")
		}
	}
}

func TestOverviewRangeValidation(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		start, end, err := overviewRange(c)
		if err != nil {
			return c.SendStatus(400)
		}
		return c.JSON([]string{start.Format(overviewDateFormat), end.Format(overviewDateFormat)})
	})
	for _, query := range []string{
		"startTime=2026-02-30&endTime=2026-03-01",
		"startTime=2026-11-19&endTime=2026-11-18",
		"startTime=2000-01-01&endTime=2026-11-18",
		"startTime=bad&endTime=2026-11-18",
	} {
		resp, err := app.Test(httptest.NewRequest("GET", "/?"+query, nil))
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != 400 {
			t.Errorf("%s: got %d", query, resp.StatusCode)
		}
	}
	for _, query := range []string{
		"startTime=2026-11-01&endTime=2026-11-18",
		"startOrderTime=2026-11-01&endOrderTime=2026-11-18",
	} {
		resp, err := app.Test(httptest.NewRequest("GET", "/?"+query, nil))
		if err != nil {
			t.Fatal(err)
		}
		var dates []string
		err = json.NewDecoder(resp.Body).Decode(&dates)
		resp.Body.Close()
		if err != nil {
			t.Fatal(err)
		}
		if len(dates) != 2 || dates[0] != "2026-11-01" || dates[1] != "2026-11-18" {
			t.Errorf("unexpected range: %v", dates)
		}
	}
}

func TestPriorYearLeapDay(t *testing.T) {
	for _, tc := range []struct{ date, want string }{
		{"2024-02-29", "2023-02-28"}, {"2025-03-01", "2024-03-01"},
	} {
		date, _ := time.Parse(overviewDateFormat, tc.date)
		if got := priorYearDate(date).Format(overviewDateFormat); got != tc.want {
			t.Errorf("%s: got %s, want %s", tc.date, got, tc.want)
		}
	}
}

func TestProfitTrendCalendarDays(t *testing.T) {
	start, _ := time.Parse(overviewDateFormat, "2026-11-01")
	end := start.AddDate(0, 0, 3)
	rows := []ProfitTrendItem{{Date: "2026-11-01", Current: 120}, {Date: "2026-11-03", Current: -20}}
	got := fillProfitDates(rows, start, end)
	if len(got) != 4 {
		t.Fatalf("got %d dates, want four calendar days", len(got))
	}
	for i, want := range []float64{120, 0, -20, 0} {
		if got[i].Current != want || got[i].Date != start.AddDate(0, 0, i).Format(overviewDateFormat) {
			t.Errorf("day %d: got %+v, want profit %v", i, got[i], want)
		}
	}
	empty := fillProfitDates(nil, start, end)
	if len(empty) != 4 {
		t.Fatal("empty period must still contain calendar days")
	}
	for _, item := range empty {
		if item.Current != 0 {
			t.Errorf("empty day has nonzero profit: %+v", item)
		}
	}
}
