import { Empty, Skeleton } from 'antd';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { init, use, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';
import useElementResize from '@/hooks/useElementResize';
import type { ProfitTrendItem } from '@/services/overview';

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

function Trend({ data }: { data: ProfitTrendItem[] }) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);
  const { width, height } = useElementResize(container);
  useEffect(() => {
    if (!container.current) return;
    chart.current = init(container.current);
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);
  useEffect(() => {
    chart.current?.setOption(
      {
        color: ['#1677ff', '#bfbfbf'],
        grid: { left: 16, right: 20, top: 48, bottom: 16, containLabel: true },
        legend: { top: 0 },
        tooltip: { trigger: 'axis', valueFormatter: (value: number) => `¥${Number(value).toFixed(2)}` },
        xAxis: { type: 'category', data: data.map((item) => item.date), boundaryGap: false },
        yAxis: { type: 'value' },
        series: [
          { name: '所选时段', type: 'line', showSymbol: false, data: data.map((item) => item.current) },
          {
            name: '上一等长周期',
            type: 'line',
            showSymbol: false,
            lineStyle: { type: 'dashed' },
            data: data.map((item) => item.compare),
          },
        ],
      },
      true,
    );
  }, [data]);
  useEffect(() => {
    chart.current?.resize();
  }, [width, height]);
  return <div ref={container} style={{ height: 300, width: '100%' }} />;
}
export default function Profit({ data, loading }: { data?: ProfitTrendItem[]; loading?: boolean }) {
  if (loading) return <Skeleton active style={{ minHeight: 300 }} />;
  if (!data?.length) return <Empty description="所选时段暂无数据" />;
  return <Trend data={data} />;
}
