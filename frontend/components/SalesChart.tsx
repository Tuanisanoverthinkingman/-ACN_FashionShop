"use client";

import { Area } from "@ant-design/charts";

interface DataItem {
  month: string;
  value: number;
}

const data: DataItem[] = [
  { month: "Jan", value: 200 },
  { month: "Feb", value: 180 },
  { month: "Mar", value: 250 },
  { month: "Apr", value: 300 },
  { month: "May", value: 280 },
  { month: "Jun", value: 350 },
  { month: "Jul", value: 370 },
  { month: "Aug", value: 300 },
  { month: "Sep", value: 320 },
  { month: "Oct", value: 360 },
  { month: "Nov", value: 400 },
  { month: "Dec", value: 420 },
];

export default function SalesChart() {
  const config = {
    data,
    xField: "month",
    yField: "value",
    height: 200,
    smooth: true,        // làm line smooth
    areaStyle: () => ({ fill: "#1890ff", fillOpacity: 0.6 }), // fill area
    color: "#1890ff",    // màu line
    xAxis: {
      tickLine: { style: { stroke: "#3a4a72" } },
      label: { style: { fill: "#8696b0" } },
    },
    yAxis: {
      tickLine: { style: { stroke: "#3a4a72" } },
      label: { style: { fill: "#8696b0" } },
    },
    tooltip: { showTitle: false },
  };

  return <Area {...config} />;
}
