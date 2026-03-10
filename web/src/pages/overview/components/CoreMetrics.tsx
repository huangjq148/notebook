import { ArrowDownOutlined, ArrowUpOutlined, InboxOutlined } from '@ant-design/icons';
import { Card, Statistic, Empty } from 'antd';
import styles from '../index.module.less';

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

interface CoreMetricsProps {
  data?: CoreMetricsData;
  loading?: boolean;
}

const formatMoney = (value: number) => {
  return `¥${value.toFixed(2)}`;
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export default function CoreMetrics({ data, loading }: CoreMetricsProps) {
  // 检查是否没有数据
  const hasNoData = !loading && (!data || (
    data.totalSales === 0 &&
    data.totalProfit === 0 &&
    data.orderCount === 0
  ));

  const metrics = [
    {
      title: '总销售额',
      value: data?.totalSales || 0,
      mom: data?.salesMoM || 0,
      formatter: formatMoney,
      color: '#1677ff',
    },
    {
      title: '总利润',
      value: data?.totalProfit || 0,
      mom: data?.profitMoM || 0,
      formatter: formatMoney,
      color: '#52c41a',
    },
    {
      title: '订单数量',
      value: data?.orderCount || 0,
      mom: data?.orderCountMoM || 0,
      formatter: (v: number) => v.toString(),
      color: '#faad14',
    },
    {
      title: '平均利润率',
      value: data?.avgProfitRate || 0,
      mom: data?.avgProfitRateMoM || 0,
      formatter: formatPercent,
      color: '#eb2f96',
    },
  ];

  if (hasNoData) {
    return (
      <Card className={styles.coreMetricsEmpty}>
        <Empty
          image={<InboxOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          description="暂无核心指标数据"
        />
      </Card>
    );
  }

  return (
    <div className={styles.coreMetricsWrapper}>
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className={styles.coreMetricsCard}
          loading={loading}
          style={{ borderTop: `4px solid ${metric.color}` }}
        >
          <Statistic
            title={metric.title}
            value={metric.formatter(metric.value)}
            valueStyle={{ color: metric.color, fontSize: '24px', fontWeight: 'bold' }}
          />
          <div className={styles.momIndicator}>
            <span>环比</span>
            <span
              style={{
                color: metric.mom >= 0 ? '#52c41a' : '#ff4d4f',
                marginLeft: '8px',
              }}
            >
              {metric.mom >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(metric.mom).toFixed(2)}%
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
