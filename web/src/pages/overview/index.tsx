import { SearchForm } from '@/components';
import { getTop5Data, getCoreMetrics } from '@/services/overview';
import { Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState, useCallback } from 'react';
import ProfitCharts from './components/Profit';
import Top5Product from './components/Top5Product';
import CoreMetrics from './components/CoreMetrics';
import RefreshControl from './components/RefreshControl';
import QuickDateFilter from './components/QuickDateFilter';
import styles from './index.module.less';

interface CoreMetricsData {
  totalSales: number;
  totalProfit: number;
  orderCount: number;
  avgProfitRate: number;
  salesMoM: number;
  profitMoM: number;
  orderCountMoM: number;
  avgProfitRateMoM: number;
}

export default () => {
  const [topData, setTopData] = useState<any>([]);
  const [coreMetrics, setCoreMetrics] = useState<CoreMetricsData>();
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const getDateConditions = () => {
    const conditions: Record<string, string> = {};
    if (dateRange[0]) {
      conditions.startOrderTime = dateRange[0].format('YYYY-MM-DD');
    }
    if (dateRange[1]) {
      conditions.endOrderTime = dateRange[1].format('YYYY-MM-DD');
    }
    return conditions;
  };

  const loadTopData = async () => {
    const conditions = getDateConditions();
    const result = (await getTop5Data(conditions)) as any;

    const newData = [
      {
        label: '购买最多的产品',
        data: result.top5BuyGoods || [],
      },
      {
        label: '卖的最多的产品',
        data: result.top5SellGoods || [],
      },
      {
        label: '利润最高的产品',
        data: result.top5ProfitGoods || [],
      },
      {
        label: '利润最多的客户',
        data: result.top5BuyCustomer || [],
      },
    ];
    setTopData(newData);
  };

  const loadCoreMetrics = async () => {
    const conditions = getDateConditions();
    const result = await getCoreMetrics(conditions);
    setCoreMetrics(result as CoreMetricsData);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadTopData(), loadCoreMetrics()]);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    } else {
      // 如果没有选择日期，默认使用本月
      setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    }
  };

  return (
    <div>
      <SearchForm>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <QuickDateFilter
            value={dateRange as [Dayjs, Dayjs]}
            onChange={handleDateChange}
          />
          <Button
            htmlType="submit"
            type="primary"
            onClick={loadAllData}
            loading={loading}
          >
            查询
          </Button>
        </div>
      </SearchForm>

      <RefreshControl
        onRefresh={loadAllData}
        loading={loading}
        lastUpdateTime={lastUpdateTime}
      />

      <CoreMetrics data={coreMetrics} loading={loading} />

      <div className={styles.topListWrapper}>
        {topData.map((topDataItem: any, index: number) => (
          <div className={styles.topListItem} key={index}>
            <Top5Product key={index} data={topDataItem} />
          </div>
        ))}
      </div>

      <SearchForm
        style={{
          height: '400px',
          width: '100%',
          marginTop: '16px',
          marginBottom: 16,
        }}
      >
        <>
          <p>近14天利润</p>
          <ProfitCharts />
        </>
      </SearchForm>
    </div>
  );
};