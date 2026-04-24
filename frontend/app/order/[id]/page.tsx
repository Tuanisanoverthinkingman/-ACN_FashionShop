"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/services/order-services";
import { getPaymentByOrderId } from "@/services/payment-services";
import { getPromotionById, Promotion } from "@/services/promotion-services";
import { toast } from "react-toastify";

interface OrderDetail {
  orderDetailId: number;
  productVariant?: {
    product?: {
      name: string;
      price: number;
      imageUrl?: string;
    } | null;
  } | null;
  product?: {
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
  status: string | number; // Hỗ trợ cả chữ và số
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

  // --- HÀM HELPER XỬ LÝ TRẠNG THÁI (FIX LỖI HIỆN SỐ 0) ---
  const getStatusText = (status: string | number) => {
    const s = String(status).toLowerCase();
    if (s === "pending" || s === "0") return "Chờ thanh toán";
    if (s === "paid" || s === "1") return "Đã thanh toán";
    if (s === "paymentfailed" || s === "2") return "Thanh toán thất bại";
    if (s === "cancelled" || s === "3") return "Đã hủy";
    if (s === "refund") return "Đơn hoàn";
    return String(status);
  };

  const getStatusColor = (status: string | number) => {
    const s = String(status).toLowerCase();
    if (s === "pending" || s === "0") return "text-yellow-600";
    if (s === "paid" || s === "1") return "text-green-600";
    if (s === "paymentfailed" || s === "2") return "text-red-600";
    if (s === "cancelled" || s === "3") return "text-gray-500";
    return "text-gray-800";
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
    <div className="p-4 pt-28 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.orderId}</h1>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
        <p><span className="font-semibold">Ngày đặt:</span> {new Date(order.orderDate).toLocaleString('vi-VN')}</p>
        <p className="mt-1">
          <span className="font-semibold">Trạng thái đơn:</span>{" "}
          <span className={`font-bold ${getStatusColor(order.orderStatus)}`}>
            {getStatusText(order.orderStatus)}
          </span>
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-3">Sản phẩm đã mua</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700">Sản phẩm</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-center">Số lượng</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Đơn giá</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.orderDetails.map((item) => {
              // Quét đúng thông tin sản phẩm
              const prodInfo = item.productVariant?.product || item.product;
              
              return (
                <tr key={item.orderDetailId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{prodInfo?.name || "Sản phẩm đã xóa"}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{item.unitPrice.toLocaleString()}₫</td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">{(item.unitPrice * item.quantity).toLocaleString()}₫</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-right">
        <p className="text-lg">Tổng thanh toán: <span className="font-bold text-2xl text-red-600">{order.totalAmount.toLocaleString()}₫</span></p>
      </div>

      {payment ? (
        <div className="mt-8 p-6 border border-blue-100 rounded-xl bg-blue-50/30 shadow-sm">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Thông tin thanh toán</h2>
          <div className="space-y-2">
            <p><span className="text-gray-600">Phương thức:</span> <span className="font-semibold">{payment.paymentMethod}</span></p>
            <p><span className="text-gray-600">Địa chỉ:</span> {payment.address}</p>
            <p><span className="text-gray-600">Số tiền cần thu:</span> <span className="font-bold text-red-600">{(payment.amount ?? 0).toLocaleString()}₫</span></p>
            <p>
              <span className="text-gray-600">Trạng thái:</span>{" "}
              {/* Render trạng thái mượt mà */}
              <span className={`font-semibold ${getStatusColor(payment.status)}`}>
                {getStatusText(payment.status)}
              </span>
            </p>
            {promotion && (
              <p className="mt-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                Áp dụng mã: {promotion.code} (-{promotion.discountPercent}%)
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center shadow-sm">
          <p className="text-gray-600 mb-4">Đơn hàng chưa có thông tin thanh toán.</p>
          <button
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            onClick={handleGoToPayment}
          >
            Thanh toán ngay
          </button>
        </div>
      )}
    </div>
  );
}