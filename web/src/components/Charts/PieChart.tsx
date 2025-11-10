import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useWindowSize } from 'react-use';

type PieChartProps = {
  data: any;
  dataKey?: string;
};

const PieChart = (props: PieChartProps) => {
  const chartRef = useRef<any>(null);
  const { dataKey = 'value', data = [] } = props;
  const { width } = useWindowSize();
  const chartInstanceRef = useRef<any>(null);

  const render = () => {
    const total = data.reduce((sum: number, d: any) => sum + d[dataKey], 0);
    const percent = ((data[0][dataKey] / total) * 100).toFixed(1) + '%';

    const myChart = echarts.init(chartRef.current);
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

    myChart.setOption(options);
  };

  useEffect(() => {
    if (chartRef.current) {
      render()
    }
  }, [data]);

  useEffect(() => {
    if (chartRef.current) {
      chartInstanceRef.current.resize();
    }
  }, [width]);

  return <div ref={chartRef} style={{ height: '300px', width: '100%' }} />;
};

export default PieChart;
