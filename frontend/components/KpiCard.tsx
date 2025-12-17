import { Card } from "antd";

interface KpiCardProps {
  title: string;
  value: number;
  color?: string;
}

export default function KpiCard({ title, value, color }: KpiCardProps) {
  return (
    <Card style={{ borderLeft: `4px solid ${color || "#1890ff"}` }} title={title} bordered>
      <div style={{ fontSize: 24, fontWeight: "bold" }}>{value}</div>
    </Card>
  );
}
