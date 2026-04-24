"use client";

import {
  ResponsiveContainer,
  ComposedChart, 
  Line,
  Bar,          
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { Card, Typography } from "antd";
import { AreaChartOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function OrdersChart({ data }: { data: any[] }) {
  return (
    <Card
      bordered={false}
      style={{ borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ padding: '24px 24px 12px 24px' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '8px', color: '#0284c7', display: 'flex' }}>
            <AreaChartOutlined style={{ fontSize: '20px' }} />
          </div>
          <Title level={4} style={{ margin: 0, color: '#334155', fontSize: '18px', fontWeight: 600 }}>
            Tổng quan Doanh thu & Đơn hàng
          </Title>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 13 }}
            dy={10}
          />
          
          <YAxis 
            yAxisId="left" 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            tick={{ fill: '#64748b', fontSize: 13 }}
            dx={-10}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 13 }}
            dx={10}
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: any, name: any) => {
              if (name === "Doanh thu") {
                return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), name];
              }
              return [value, name];
            }}
          />
          
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          
          <Bar 
            yAxisId="left" 
            dataKey="totalAmount" 
            name="Doanh thu" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
          />

          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="totalOrders" 
            stroke="#0284c7" 
            name="Số đơn hàng" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}