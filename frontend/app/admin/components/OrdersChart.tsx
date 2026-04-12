import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card } from "antd";

export default function OrdersChart({ data }: { data: any[] }) {
  return (
    <Card title="📈 Doanh thu theo tháng">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="totalOrders" stroke="#1677ff" name="Orders" />
          <Line type="monotone" dataKey="totalAmount" stroke="#52c41a" name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
