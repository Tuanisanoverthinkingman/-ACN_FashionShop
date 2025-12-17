"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Card } from "antd";
import { getAllUsers } from "@/services/user-services";
import { getAll as getAllProducts } from "@/services/product-services";
import { getAllOrders } from "@/services/order-services";
import { toast } from "react-toastify";
import { Column } from "@ant-design/charts";
import { UserOutlined, ShoppingCartOutlined, GiftOutlined } from "@ant-design/icons";

export default function DashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const chartData = [
    { type: "Users", value: totalUsers },
    { type: "Products", value: totalProducts },
    { type: "Orders", value: totalOrders },
  ];

  const columnConfig = {
    data: chartData,
    xField: "type",
    yField: "value",
    color: ["#1890ff", "#52c41a", "#faad14"],
    label: {
      position: "middle",
      style: {
        fill: "#fff",
        opacity: 0.85,
        fontSize: 14,
      },
    },
    xAxis: {
      label: {
        autoHide: false,
        style: { fontSize: 14, fill: "#555" },
      },
    },
    yAxis: {
      min: 0,
      tickCount: 5,
    },
    tooltip: {
      formatter: (datum: any) => ({ name: datum.type, value: datum.value }),
    },
    height: 280,
    padding: [30, 30, 50, 50],
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const users = await getAllUsers();
        const products = await getAllProducts();
        const orders = await getAllOrders();

        setTotalUsers(users?.length ?? 0);
        setTotalProducts(products?.length ?? 0);
        setTotalOrders(orders?.length ?? 0);
      } catch (err) {
        console.error(err);
        toast.error("Lấy dữ liệu dashboard thất bại");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              background: "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
              color: "#fff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <UserOutlined style={{ fontSize: 32, marginBottom: 12 }} />
            <div className="text-3xl font-bold">{totalUsers}</div>
            <div className="mt-1 text-lg opacity-90">Total Users</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
              color: "#fff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <GiftOutlined style={{ fontSize: 32, marginBottom: 12 }} />
            <div className="text-3xl font-bold">{totalProducts}</div>
            <div className="mt-1 text-lg opacity-90">Total Products</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              background: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
              color: "#fff",
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <ShoppingCartOutlined style={{ fontSize: 32, marginBottom: 12 }} />
            <div className="text-3xl font-bold">{totalOrders}</div>
            <div className="mt-1 text-lg opacity-90">Total Orders</div>
          </Card>
        </Col>
      </Row>

      {/* System Overview Chart */}
      <Row gutter={16}>
        <Col span={24}>
          <Card
            title="System Overview"
            style={{
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            }}
          >
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
