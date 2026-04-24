"use client";

import { Row, Col, Card, Statistic } from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

interface SummaryData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export default function SummaryCards({ summary }: { summary: SummaryData }) {
  const cardsConfig = [
    {
      title: "Tổng người dùng",
      value: summary?.totalUsers || 0,
      icon: <UserOutlined />,
      bgColor: "#e0f2fe", 
      color: "#0284c7",   
    },
    {
      title: "Tổng hoá đơn",
      value: summary?.totalOrders || 0,
      icon: <ShoppingCartOutlined />,
      bgColor: "#ffedd5", 
      color: "#ea580c",   
    },
    {
      title: "Tổng doanh thu",
      value: summary?.totalRevenue || 0,
      icon: <DollarOutlined />,
      bgColor: "#d1fae5", 
      color: "#059669",   
      isCurrency: true,   
    },
    {
      title: "Tổng sản phẩm",
      value: summary?.totalProducts || 0,
      icon: <AppstoreOutlined />,
      bgColor: "#f3e8ff", 
      color: "#9333ea",   
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      {cardsConfig.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            bordered={false}
            hoverable
            style={{
              borderRadius: "12px",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={<span style={{ color: "#64748b", fontWeight: 500, fontSize: "14px" }}>{card.title}</span>}
              value={card.value}
              formatter={(val) => 
                card.isCurrency 
                  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val))
                  : new Intl.NumberFormat('vi-VN').format(Number(val))
              }
              valueStyle={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "8px" }}
              prefix={
                <div
                  style={{
                    backgroundColor: card.bgColor,
                    color: card.color,
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                    fontSize: "24px",
                  }}
                >
                  {card.icon}
                </div>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}