import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';
import { useWindowSize } from 'react-use';

type BarChartProps = {
  xAxis: string[];
  yAxis: string[] | number[];
  height?: number;
};

const BarChart = (props: BarChartProps) => {
  const chartRef = useRef<any>(null);
  const { xAxis = [], yAxis = [], height = '300px' } = props;
  const { width } = useWindowSize();
  const chartInstanceRef = useRef<any>(null);

  const render = () => {
    chartInstanceRef.current = echarts.init(chartRef.current);
    const option = {
      grid: {
        left: 20, // 🔹 左侧内边距，默认 60
        right: 20, // 🔹 右侧内边距，默认 60
        top: 50,
        bottom: 50,
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

    chartInstanceRef.current.setOption(option);
  };

  useEffect(() => {
    if (chartRef.current) {
      render();
    }
  }, [xAxis, yAxis]);

  useEffect(() => {
    if (chartRef.current) {
      chartInstanceRef.current.resize();
    }
  }, [width]);

  return <div ref={chartRef} style={{ height, width: '100%' }} />;
};

export default BarChart;
