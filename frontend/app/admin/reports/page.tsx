"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag } from "antd";
import { DollarOutlined, RiseOutlined, ShoppingOutlined, AlertOutlined } from "@ant-design/icons";
import { 
  getOrdersByMonth, 
  getOrderStatusStats, 
  getRevenueByCategory, 
  getLowStockProducts 
} from "@/services/report-services"; 
import { toast } from "react-toastify";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

export default function ReportsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ revenue: 0, profit: 0 });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const fetchData = async () => {
    try {
      const [monthData, statusData, catData, stockData] = await Promise.all([
        getOrdersByMonth(),
        getOrderStatusStats(),
        getRevenueByCategory(),
        getLowStockProducts(10)
      ]);
      
      setChartData(monthData);
      setOrderStatusData(statusData);
      setCategoryData(catData);
      setLowStockData(stockData);

      const totalRev = monthData.reduce((sum: number, item: any) => sum + (item.doanhThu || 0), 0);
      const totalProf = monthData.reduce((sum: number, item: any) => sum + (item.loiNhuan || 0), 0);
      setTotalStats({ revenue: totalRev, profit: totalProf });

    } catch (error) {
      toast.error("Không thể tải dữ liệu báo cáo");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stockColumns = [
    { 
      title: 'Sản phẩm', 
      dataIndex: 'productName', 
      key: 'productName',
      render: (text: string) => <span className="font-medium text-slate-700">{text}</span>
    },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Màu', dataIndex: 'color', key: 'color' },
    { 
      title: 'Tồn kho', 
      dataIndex: 'instock', 
      key: 'instock',
      render: (val: number) => <Tag color={val <= 5 ? "red" : "orange"}>{val} cái</Tag>
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Báo cáo thống kê</h1>
      
      {/* Hàng 1: Thẻ Tổng Quan */}
      <Row gutter={[16, 16]}>
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

      {/* Hàng 2: Biểu đồ tăng trưởng */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm h-[400px]">
        <h3 className="text-lg font-semibold text-slate-700 mb-6">Biểu đồ Tăng trưởng (VNĐ)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value: any) => typeof value === 'number' ? `${(value / 1000000).toFixed(1)}M` : value} 
            />
            <Tooltip 
              formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
              cursor={{fill: '#f1f5f9'}}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="doanhThu" name="Doanh thu" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
            <Bar dataKey="loiNhuan" name="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hàng 3: Biểu đồ Tròn & Biểu đồ Danh mục */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={10}>
          <Card bordered={false} className="shadow-sm rounded-xl h-[400px]">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <ShoppingOutlined /> Tỷ lệ trạng thái đơn hàng
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  label={(entry: any) => `${entry.status || entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card bordered={false} className="shadow-sm rounded-xl h-[400px]">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Doanh thu theo danh mục</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="categoryName" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="revenue" name="Doanh thu" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={25}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Hàng 4: Cảnh báo sắp hết hàng */}
      <div className="mt-6">
        <Card bordered={false} className="shadow-sm rounded-xl">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2 text-red-500">
            <AlertOutlined /> Sản phẩm sắp hết hàng
          </h3>
          <Table 
            dataSource={lowStockData} 
            columns={stockColumns} 
            rowKey={(record) => `${record.productId}-${record.size}-${record.color}`}
            pagination={false}
            size="middle"
          />
        </Card>
      </div>

    </div>
  );
}