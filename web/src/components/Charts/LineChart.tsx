import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Empty } from "antd"


type LineChartProps = {
  data: any[];
  xAxis: string;
  yAxis: string;
  tooltip?: boolean;
  legend?: boolean;
};

const LineChartComponent = (props: LineChartProps) => {
  return props.data?.length ? (
    <ResponsiveContainer width="100%" height="90%">
      <LineChart data={props.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={props.xAxis} />
        <YAxis dataKey={props.yAxis} />
        {props.tooltip && <Tooltip />}
        {props.legend && <Legend />}
        <Line type="monotone" dataKey={props.yAxis} stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  ) : <Empty />;
};

export default LineChartComponent;
