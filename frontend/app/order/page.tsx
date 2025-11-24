"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { getMe } from "@/services/order-services";

export default function OrderPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getMe();
        setOrders(data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading)
    return <p className="text-center mt-10">Đang tải danh sách đơn hàng...</p>;

  if (!orders || orders.length === 0)
    return <p className="text-center mt-10">Bạn chưa có đơn hàng nào 😢</p>;

  return (
    <>
      <NavBar />
      <section className="max-w-5xl mx-auto pt-32 px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Danh sách đơn hàng</h2>

        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            // Tính tổng tiền từ orderDetails nếu có
            const totalAmount = order.orderDetails
              ? order.orderDetails.reduce(
                  (sum: number, item: any) => sum + item.unitPrice * item.quantity,
                  0
                )
              : order.totalPrice ?? 0;

            // Ngày đặt
            const orderDateString = order.orderDate || order.createdAt || order.date || null;
            let formattedDate = "N/A";
            if (orderDateString) {
              const date = new Date(orderDateString);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleString("vi-VN");
              }
            }

            // Màu trạng thái
            let statusColor = "text-gray-500";
            if (order.status === "Pending") statusColor = "text-yellow-500";
            else if (order.status === "Completed") statusColor = "text-green-500";
            else if (order.status === "Cancelled") statusColor = "text-red-500";

            return (
              <Link
                key={order.orderId}
                href={`/order-detail?orderId=${order.orderId}`}
                className="flex justify-between items-center bg-white p-4 rounded-lg shadow hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold">Đơn hàng #{order.orderId}</p>
                  <p className="text-gray-500">Ngày: {formattedDate}</p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalAmount)}
                  </p>

                  <p className={`font-semibold ${statusColor}`}>
                    {order.status ?? "Pending"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
