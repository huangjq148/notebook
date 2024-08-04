import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Empty } from "antd";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#80de1d",
  "#ff4242",
  "#4542ff",
  "#ff42d0",
  "#42cdff",
  "#20f90c",
  "#22b658",
];

type PieChartProps = {
  data: any[];
  dataKey: string;
  tooltip?: boolean;
  legend?: boolean;
  label?: any;
  showInnerLabel?: boolean;
  showOuterLabel?: boolean;
};

const PieChartComponent = (props: PieChartProps) => {
  const label = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, ...restProps }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25; // 向外移动
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const radius1 = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x1 = cx + radius1 * Math.cos(-midAngle * RADIAN);
    const y1 = cy + radius1 * Math.sin(-midAngle * RADIAN);

    return (
      <>
        {props.showOuterLabel && (
          <text x={x} y={y} fill="#666" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
            {restProps.name}
          </text>
        )}
        {props.showInnerLabel && (
          <text x={x1} y={y1 + 10} fill="white" textAnchor={x1 > cx ? "start" : "end"} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
          </text>
        )}
      </>
    );
  };

  return props?.data?.length ? (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          dataKey={props.dataKey}
          isAnimationActive={false}
          data={props.data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          labelLine={props.showOuterLabel ?? false}
          label={label}
        >
          {props.data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  ) : <Empty />;
};

export default PieChartComponent;
