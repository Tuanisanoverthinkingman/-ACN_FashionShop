"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic } from "antd";
import { DollarOutlined, RiseOutlined } from "@ant-design/icons";
import { getOrdersByMonth } from "@/services/report-services";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ revenue: 0, profit: 0 });

  const fetchData = async () => {
    try {
      const data = await getOrdersByMonth();
      console.log("DỮ LIỆU TỪ BACKEND TRẢ VỀ:", data);
      
      setChartData(data);

      const totalRev = data.reduce((sum: number, item: any) => sum + (item.doanhThu || 0), 0);
      const totalProf = data.reduce((sum: number, item: any) => sum + (item.loiNhuan || 0), 0);
      
      setTotalStats({ revenue: totalRev, profit: totalProf });

    } catch (error) {
      toast.error("Không thể tải dữ liệu báo cáo");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Báo cáo thống kê</h1>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card bordered={false} className="shadow-sm rounded-xl">
            <Statistic
              title={<span className="text-slate-500 font-medium">Tổng doanh thu toàn thời gian</span>}
              value={totalStats.revenue}
              precision={0}
              valueStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
              prefix={<DollarOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false} className="shadow-sm rounded-xl">
            <Statistic
              title={<span className="text-slate-500 font-medium">Lợi nhuận toàn thời gian</span>}
              value={totalStats.profit}
              precision={0}
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              prefix={<RiseOutlined />}
              suffix="₫"
            />
          </Card>
        </Col>
      </Row>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm h-[400px]">
        <h3 className="text-lg font-semibold text-slate-700 mb-6">Biểu đồ Tăng trưởng (VNĐ)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value: any) => typeof value === 'number' ? `${(value / 1000000).toFixed(1)}M` : value} 
            />
            <Tooltip 
              formatter={(value: any) => {
                if (typeof value !== 'number') return value;
                return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
              }}
              cursor={{fill: '#f1f5f9'}}
            />
            <Legend iconType="circle" />
            
            <Bar dataKey="doanhThu" name="Doanh thu" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
            <Bar dataKey="loiNhuan" name="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}