import { useEffect, useState } from 'react';
import { getProfitStatistics } from '@/services/overview';
import { LineChart } from '@/components';

export default function Charts() {
  const [options, setOptions] = useState<{ xAxis: string[]; yAxis: string[] | number[] }>({ xAxis: [], yAxis: [] });

  const lodData = async () => {
    const result: any = await getProfitStatistics();
    setOptions({
      xAxis: result.map((item: any) => item.orderTime),
      yAxis: result.map((item: any) => item.profit),
    });
  };

  useEffect(() => {
    lodData();
  }, []);

  return <LineChart xAxis={options.xAxis} yAxis={options.yAxis} />;
}
