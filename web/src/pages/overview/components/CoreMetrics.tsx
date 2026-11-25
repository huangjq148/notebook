import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import { Card, Statistic, Tooltip } from 'antd';
import type { CoreMetricsData } from '@/services/overview';
import styles from '../index.module.less';

export default function CoreMetrics({ data, loading }: { data?: CoreMetricsData; loading?: boolean }) {
  const metrics = [
    { title: '销售额', value: data?.totalSales, mom: data?.salesMoM, prefix: '¥', precision: 2 },
    { title: '利润', value: data?.totalProfit, mom: data?.profitMoM, prefix: '¥', precision: 2 },
    { title: '订单数', value: data?.orderCount, mom: data?.orderCountMoM, suffix: '笔', precision: 0 },
    { title: '销售利润率', value: data?.avgProfitRate, mom: data?.avgProfitRateMoM, suffix: '%', precision: 2 },
  ];
  return (
    <div className={styles.coreMetricsWrapper}>
      {metrics.map((metric, index) => (
        <Card key={metric.title} loading={loading}>
          <Tooltip title={index === 3 ? '利润 ÷ 销售额；利润已扣除商品成本及其他费用' : undefined}>
            <Statistic
              title={metric.title}
              value={metric.value ?? 0}
              prefix={metric.prefix}
              suffix={metric.suffix}
              precision={metric.precision}
              valueStyle={{ fontSize: 28, fontWeight: 600, color: (metric.value ?? 0) < 0 ? '#cf1322' : undefined }}
            />
          </Tooltip>
          <Tooltip
            title={`上一等长周期：${data?.previousStart ?? '—'} 至 ${data?.previousEnd ?? '—'}；上期为零时不计算增幅`}
          >
            <div className={styles.momIndicator}>
              <span>较上期</span>
              {metric.mom == null ? (
                <span>—</span>
              ) : (
                <span style={{ color: metric.mom === 0 ? '#8c8c8c' : metric.mom > 0 ? '#389e0d' : '#cf1322' }}>
                  {metric.mom === 0 ? <MinusOutlined /> : metric.mom > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(metric.mom).toFixed(2)}
                  {index === 3 ? ' 个百分点' : '%'}
                </span>
              )}
            </div>
          </Tooltip>
        </Card>
      ))}
    </div>
  );
}
