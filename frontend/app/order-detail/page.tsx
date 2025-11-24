"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getById } from "@/services/order-services";

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const data = await getById(Number(orderId));
        setOrder(data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading)
    return <p className="text-center mt-10">Đang tải chi tiết đơn hàng...</p>;

  if (!order)
    return <p className="text-center mt-10">Không tìm thấy đơn hàng 😢</p>;

  // Tổng tiền tính từ orderDetails
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
    if (!isNaN(date.getTime())) formattedDate = date.toLocaleString("vi-VN");
  }

  return (
    <>
      <NavBar />
      <section className="max-w-4xl mx-auto pt-32 px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Chi tiết đơn hàng #{order.orderId}
        </h2>

        <p className="mb-4 text-gray-500">Ngày đặt: {formattedDate}</p>
        <p className="mb-4 text-gray-500">Trạng thái: {order.status}</p>

        <div className="flex flex-col gap-4 mb-6">
          {order.orderDetails?.map((item: any) => (
            <div
              key={item.productId}
              className="flex items-center bg-white p-4 rounded-lg shadow"
            >
              <img
                src={item.product?.imageUrl}
                alt={item.product?.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 ml-4">
                <p className="font-semibold">{item.product?.name}</p>
                <p>
                  {item.quantity} x{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-red-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.unitPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="text-right text-xl font-bold">
          Tổng tiền:{" "}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(totalAmount)}
        </div>
      </section>
    </>
  );
}
