import React, { useEffect, useRef } from 'react';
import { PieChart as EChartsPieChart } from 'echarts/charts';
import { GraphicComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { init, use, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import useElementResize from '@/hooks/useElementResize';

use([EChartsPieChart, GraphicComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type PieChartProps = {
  data: any;
  dataKey?: string;
};

const PieChart = (props: PieChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { dataKey = 'value', data = [] } = props;
  const { width, height } = useElementResize(chartRef);
  const chartInstanceRef = useRef<EChartsType | null>(null);

  const render = () => {
    if (!chartRef.current || data.length === 0) return;
    const total = data.reduce((sum: number, d: any) => sum + d[dataKey], 0);
    const percent = ((data[0][dataKey] / total) * 100).toFixed(1) + '%';

    chartInstanceRef.current ??= init(chartRef.current);
    const options = {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        bottom: 0,
        left: 'center',
        type: 'scroll',
      },
      series: [
        {
          name: '销售数据',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: percent, // ✅ 自动计算百分比
              textAlign: 'center',
              fill: '#333',
              fontSize: 20,
              fontWeight: 'bold',
            },
          },
          data: data.map((item: any) => ({ ...item, value: item[dataKey] })),
        },
      ],
    };

    chartInstanceRef.current?.setOption(options);
  };

  useEffect(() => {
    if (chartRef.current) {
      render();
    }
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [data, dataKey]);

  useEffect(() => {
    chartInstanceRef.current?.resize();
  }, [width, height]);

  return <div ref={chartRef} style={{ height: '300px', width: '100%' }} />;
};

export default PieChart;
