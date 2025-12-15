"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Card } from "antd";
import { getAllUsers } from "@/services/user-services";
import { getAll as getAllProducts } from "@/services/product-services";
import { getAllOrders } from "@/services/order-services";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const users = await getAllUsers(); // trả về array thẳng
        const products = await getAllProducts(); // trả về array thẳng
        const orders = await getAllOrders(); // trả về res.data.orders

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

  if (loading) {
    return <p>Đang tải dữ liệu...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Total Users" variant="outlined">
            {totalUsers}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Total Products" variant="outlined">
            {totalProducts}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Total Orders" variant="outlined">
            {totalOrders}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
