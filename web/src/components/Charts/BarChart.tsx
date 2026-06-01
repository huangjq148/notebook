import { BarChart as EChartsBarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { init, use, type EChartsType } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';
import useElementResize from '@/hooks/useElementResize';

use([EChartsBarChart, GridComponent, TooltipComponent, CanvasRenderer]);

type BarChartProps = {
  xAxis: string[];
  yAxis: string[] | number[];
  height?: number;
};

const BarChart = (props: BarChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { xAxis = [], yAxis = [], height = '300px' } = props;
  const { width, height: chartHeight } = useElementResize(chartRef);
  const chartInstanceRef = useRef<EChartsType | null>(null);

  const render = () => {
    if (!chartRef.current) return;
    chartInstanceRef.current ??= init(chartRef.current);
    const option = {
      grid: {
        left: 20, // 🔹 左侧内边距，默认 60
        right: 20, // 🔹 右侧内边距，默认 60
        top: 20,
        bottom: 20,
        containLabel: true, // 确保标签不会被裁剪
      },
      xAxis: {
        type: 'category',
        data: xAxis,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: yAxis,
          type: 'bar',
        },
      ],
      tooltip: {
        showTip: true,
        trigger: 'axis',
      },
    };

    chartInstanceRef.current?.setOption(option);
  };

  useEffect(() => {
    if (chartRef.current) {
      render();
    }
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [xAxis, yAxis]);

  useEffect(() => {
    chartInstanceRef.current?.resize();
  }, [width, chartHeight]);

  return <div ref={chartRef} style={{ height, width: '100%' }} />;
};

export default BarChart;
