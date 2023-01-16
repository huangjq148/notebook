import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SearchForm } from "@/components";

const data = [
  {
    name: "Page A",
    profit: 4000,
  },
  {
    name: "Page B",
    profit: 3000,
  },
  {
    name: "Page C",
    profit: 2000,
  },
  {
    name: "Page D",
    profit: 2780,
  },
  {
    name: "Page E",
    profit: 1890,
  },
  {
    name: "Page F",
    profit: 2390,
  },
  {
    name: "Page G",
    profit: 3490,
  },
  {
    name: "Page A",
    profit: 4000,
  },
  {
    name: "Page B",
    profit: 3000,
  },
  {
    name: "Page C",
    profit: 2000,
  },
  {
    name: "Page D",
    profit: 2780,
  },
  {
    name: "Page E",
    profit: 1890,
  },
  {
    name: "Page F",
    profit: 2390,
  },
  {
    name: "Page G",
    profit: 3490,
  },
  {
    name: "Page A",
    profit: 4000,
  },
  {
    name: "Page B",
    profit: 3000,
  },
  {
    name: "Page C",
    profit: 2000,
  },
  {
    name: "Page D",
    profit: 2780,
  },
  {
    name: "Page E",
    profit: 1890,
  },
  {
    name: "Page F",
    profit: 2390,
  },
  {
    name: "Page G",
    profit: 3490,
  },
];

export default function Charts() {
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {}, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="profit" stroke="#8884d8" activeDot={{ r: 8 }} />
        {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
      </LineChart>
    </ResponsiveContainer>
  );
}
