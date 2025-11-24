"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { createPayment } from "@/services/payment-services";

interface CheckoutItem {
  cartItemId: number;
  productId: number;
  quantity: number;
  product: {
    name: string;
    imageUrl: string;
    price: number;
  } | null;
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: "",
  });

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("checkoutItems");
    if (stored) {
      setItems(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (items.length === 0) {
      alert("Không có sản phẩm để thanh toán 😢");
      return;
    }

    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng 😢");
      return;
    }

    setProcessing(true);
    try {
      const cartItemIds = items.map((item) => item.cartItemId);

      const payload: any = {
        paymentMethod: "Cash",
        cartItemIds: cartItemIds,
        shippingInfo: shippingInfo,
      };

      const existingOrderId = Number(localStorage.getItem("currentOrderId"));
      if (existingOrderId) {
        payload.orderId = existingOrderId;
      }

      const response = await createPayment(payload);

      const newOrderId = response?.order?.orderId;
      if (!newOrderId) throw new Error("Không lấy được orderId từ API");

      alert("Thanh toán COD thành công 🎉");

      localStorage.removeItem("checkoutItems");

      router.push(`/order-detail?orderId=${newOrderId}`);
    } catch (err) {
      console.error(err);
      alert("Thanh toán thất bại 😢");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <p className="mt-32 text-center">Đang tải...</p>;
  if (items.length === 0)
    return <p className="mt-32 text-center">Bạn chưa chọn sản phẩm để thanh toán 😢</p>;

  return (
    <>
      <NavBar />

      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Thanh toán</h2>

        {/* Danh sách sản phẩm */}
        <div className="flex flex-col gap-4 mb-8">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="flex items-center gap-4 bg-white p-4 rounded-lg shadow"
            >
              <img
                src={item.product?.imageUrl}
                alt={item.product?.name} className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                <p className="text-gray-500">
                  {item.quantity} x{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(item.product?.price || 0)}
                </p>
              </div>
              <p className="font-semibold">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format((item.product?.price || 0) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Thông tin giao hàng */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 flex flex-col gap-4">
          <h3 className="text-xl font-semibold mb-2">Thông tin giao hàng</h3>
          <input
            type="text"
            placeholder="Họ và tên"
            value={shippingInfo.fullName}
            onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={shippingInfo.phone}
            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Địa chỉ"
            value={shippingInfo.address}
            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <textarea
            placeholder="Ghi chú (nếu có)"
            value={shippingInfo.note}
            onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Tổng tiền + thanh toán */}
        <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xl font-semibold">
            Tổng:{" "}
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(totalPrice)}
          </div>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 w-full md:w-auto"
          >
            {processing ? "Đang xử lý..." : "Thanh toán COD"}
          </button>
        </div>
      </section>
    </>
  );
}