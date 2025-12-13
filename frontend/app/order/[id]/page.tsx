"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/services/order-services";
import { getPaymentByOrderId } from "@/services/payment-services";
import { getPromotionById, Promotion } from "@/services/promotion-services";
import { toast } from "react-toastify";

interface OrderDetail {
  orderDetailId: number;
  product: {
    name: string;
    price: number;
    imageUrl?: string;
  } | null;
  quantity: number;
  unitPrice: number;
  productId: number;
  categoryId: number;
}

interface Order {
  orderId: number;
  orderDate: string;
  orderStatus: string;
  orderDetails: OrderDetail[];
  totalAmount: number;
}

interface Payment {
  paymentId: number;
  amount: number;
  status: number;
  paymentMethod: string;
  address: string;
  promoId?: number;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  const paymentStatusMap: Record<number, string> = {
    0: "Pending",
    1: "Paid",
    2: "PaymentFailed",
    3: "Cancelled",
  };

  const statusTextMap: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    PaymentFailed: "Thanh toán thất bại",
    Cancelled: "Đã hủy",
    Refund: "Đơn hoàn",
  };

  const statusColorMap: Record<string, string> = {
    Pending: "text-yellow-600",
    Paid: "text-green-600",
    PaymentFailed: "text-red-600",
    Cancelled: "text-gray-500",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const orderData = await getOrderById(Number(id));
        setOrder(orderData);

        try {
          const res = await getPaymentByOrderId(Number(id));
          const paymentData = res ?? null;
          setPayment(paymentData);

          if (paymentData?.promoId) {
            const promoData = await getPromotionById(paymentData.promoId);
            if (promoData) setPromotion(promoData);
          }
        } catch (err) {
          setPayment(null);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lấy thông tin đơn hàng thất bại");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="pt-28 text-center">Đang tải đơn hàng...</div>;
  if (!order) return <div className="pt-28 text-center">Không tìm thấy đơn hàng!</div>;

  const handleGoToPayment = () => {
    router.push(`/checkout/${order.orderId}`);
  };

  return (
    <div className="p-4 pt-28">
      <h1 className="text-xl font-bold mb-4">Chi tiết đơn hàng #{order.orderId}</h1>
      <p>Ngày đặt: {new Date(order.orderDate).toLocaleString()}</p>
      <p>
        Trạng thái:{" "}
        <span className={statusColorMap[order.orderStatus] || ""}>
          {statusTextMap[order.orderStatus] || order.orderStatus}
        </span>
      </p>

      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="px-4 py-2 border">Sản phẩm</th>
            <th className="px-4 py-2 border">Số lượng</th>
            <th className="px-4 py-2 border">Đơn giá</th>
            <th className="px-4 py-2 border">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {order.orderDetails.map((item) => (
            <tr key={item.orderDetailId} className="text-center">
              <td className="px-4 py-2 border">{item.product?.name || "Sản phẩm đã xóa"}</td>
              <td className="px-4 py-2 border">{item.quantity}</td>
              <td className="px-4 py-2 border">{item.unitPrice.toLocaleString()}₫</td>
              <td className="px-4 py-2 border">{(item.unitPrice * item.quantity).toLocaleString()}₫</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 font-bold">Tổng tiền: {order.totalAmount.toLocaleString()}₫</p>

      {payment ? (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="font-bold mb-2">Thông tin thanh toán</h2>
          <p>Phương thức: {payment.paymentMethod}</p>
          <p>Địa chỉ: {payment.address}</p>
          <p>Số tiền: {payment.amount?.toLocaleString() ?? 0}₫</p>
          <p>
            Trạng thái:{" "}
            <span className={statusColorMap[paymentStatusMap[payment.status]] || ""}>
              {statusTextMap[paymentStatusMap[payment.status]] || "Unknown"}
            </span>
          </p>
          {promotion && (
            <p>
              Mã khuyến mãi áp dụng: {promotion.code} (-{promotion.discountPercent}%)
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleGoToPayment}
          >
            Thanh toán ngay
          </button>
        </div>
      )}
    </div>
  );
}
