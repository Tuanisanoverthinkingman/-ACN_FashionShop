"use client";

import { useEffect, useState } from "react";
import { Spin, Row, Col } from "antd";
import { toast } from "react-toastify";

import SummaryCards from "./components/SummaryCards";
import OrdersChart from "./components/OrdersChart";
import TopProducts from "./components/TopProducts";

import {
  getDashboardSummary,
  getOrdersByMonth,
  getTopProducts,
} from "@/services/report-services";

/* ======================
   TYPES
====================== */
interface DashboardSummary {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

/* ======================
   DEFAULT STATE
====================== */
const EMPTY_SUMMARY: DashboardSummary = {
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalProducts: 0,
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryRes, chartRes, topRes] = await Promise.all([
          getDashboardSummary(),
          getOrdersByMonth(),
          getTopProducts(),
        ]);

        setSummary(summaryRes ?? EMPTY_SUMMARY);
        setChartData(chartRes ?? []);
        setTopProducts(topRes ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải dashboard 😢");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* ======================
     LOADING
  ====================== */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  /* ======================
     UI
  ====================== */
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📊 Admin Dashboard</h1>

      {/* SUMMARY */}
      <SummaryCards summary={summary} />

      {/* CHART + TOP PRODUCTS */}
      <Row gutter={16} className="mt-6">
        <Col span={14}>
          <OrdersChart data={chartData} />
        </Col>
        <Col span={10}>
          <TopProducts data={topProducts} />
        </Col>
      </Row>
    </div>
  );
}
