import { getTop5Data, getCoreMetrics, getProfitTrend } from '@/services/overview';
import type { CoreMetricsData, OverviewRankings, ProfitTrendItem } from '@/services/overview';
import { Alert, Button, Card } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState, useCallback, useRef } from 'react';
import ProfitCharts from './components/Profit';
import Top5Product from './components/Top5Product';
import CoreMetrics from './components/CoreMetrics';
import RefreshControl from './components/RefreshControl';
import QuickDateFilter from './components/QuickDateFilter';
import styles from './index.module.less';

interface OverviewData {
  rankings: OverviewRankings;
  metrics: CoreMetricsData;
  trend: ProfitTrendItem[];
}

export default function Overview() {
  const [data, setData] = useState<OverviewData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>();
  const requestId = useRef(0);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs()]);
  const startTime = dateRange[0].format('YYYY-MM-DD');
  const endTime = dateRange[1].format('YYYY-MM-DD');

  const loadAllData = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const params = { startTime, endTime };
      const [rankings, metrics, trend] = await Promise.all([
        getTop5Data(params),
        getCoreMetrics(params),
        getProfitTrend(params),
      ]);
      if (id !== requestId.current) return;
      setData({ rankings, metrics, trend });
      setLastUpdateTime(new Date());
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [startTime, endTime]);

  useEffect(() => {
    setData(undefined);
    setLastUpdateTime(undefined);
    void loadAllData();
    return () => {
      requestId.current += 1;
    };
  }, [loadAllData]);

  const rankings = [
    { key: 'top5SellGoods', label: '销售额 TOP 5' },
    { key: 'top5ProfitGoods', label: '产品利润 TOP 5' },
    { key: 'top5BuyCustomer', label: '客户利润贡献 TOP 5' },
    { key: 'top5BuyGoods', label: '已售商品成本 TOP 5' },
  ] as const;

  return (
    <div className={styles.overview}>
      <div className={styles.pageHeading}>
        <div>
          <h2>经营概览</h2>
          <p>查看销售表现、利润变化与主要贡献来源</p>
        </div>
        <span className={styles.periodLabel}>
          {startTime} 至 {endTime}
        </span>
      </div>
      <div className={styles.toolbar}>
        <QuickDateFilter value={dateRange} onChange={setDateRange} />
        <RefreshControl onRefresh={loadAllData} loading={loading} lastUpdateTime={lastUpdateTime} />
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          title={data ? '刷新失败，当前显示上次成功加载的数据' : '数据加载失败，请重试'}
          action={
            <Button size="small" onClick={loadAllData} loading={loading}>
              重试
            </Button>
          }
        />
      )}
      {(!error || data) && (
        <>
          <CoreMetrics data={data?.metrics} loading={loading} />
          <Card title="利润趋势" extra={<span className={styles.unit}>单位：元</span>}>
            <ProfitCharts data={data?.trend} loading={loading} />
          </Card>
          <div className={styles.topListWrapper}>
            {rankings.map((item) => (
              <Card key={item.key} loading={loading}>
                <Top5Product title={item.label} data={data?.rankings[item.key] ?? []} />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
