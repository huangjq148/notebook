import { useEffect, useState } from 'react';
import { getProfitStatistics } from '@/services/overview';
import { LineChart } from '@/components';

export default function Charts() {
  const [dataSource, setDataSource] = useState([]);

  const lodData = async () => {
    const result = await getProfitStatistics();
    setDataSource(result as any);
  };

  useEffect(() => {
    lodData();
  }, []);

  return <LineChart data={dataSource} xAxis="orderTime" yAxis="profit" />;
}
