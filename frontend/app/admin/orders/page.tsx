"use client";

import { useEffect, useState } from "react";
import { getAllOrders, deleteOrder } from "@/services/order-services";
import { getPaymentByOrderId } from "@/services/payment-services";
import { getPromotionById, Promotion } from "@/services/promotion-services";
import { getOrderDetailsForAdmin } from "@/services/orderdetail-services";
import { toast } from "react-toastify";
import { updatePaymentStatus } from "@/services/payment-services";

interface OrderDetail {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice?: number;
}

interface Payment {
  paymentId: number;
  amount: number;
  status: number | string;
  paymentMethod: string;
  address: string;
  promoId?: number;
}

interface Order {
  orderId: number;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  orderDetails: OrderDetail[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [updating, setUpdating] = useState(false);

  const getStatusBadge = (status: string | number) => {
    const statusStr = String(status).toLowerCase();

    // Bản đồ từ vựng kết hợp class màu của Tailwind
    const statusMap: Record<string, { bg: string, text: string, label: string }> = {
      "pending": { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ thanh toán" },
      "0": { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ thanh toán" },
      "paid": { bg: "bg-green-100", text: "text-green-700", label: "Đã thanh toán" },
      "1": { bg: "bg-green-100", text: "text-green-700", label: "Đã thanh toán" },
      "paymentfailed": { bg: "bg-red-100", text: "text-red-700", label: "Thanh toán lỗi" },
      "2": { bg: "bg-red-100", text: "text-red-700", label: "Thanh toán lỗi" },
      "cancelled": { bg: "bg-gray-200", text: "text-gray-700", label: "Đã hủy" },
      "3": { bg: "bg-gray-200", text: "text-gray-700", label: "Đã hủy" },
      "refund": { bg: "bg-purple-100", text: "text-purple-700", label: "Hoàn tiền" },
      "processing": { bg: "bg-blue-100", text: "text-blue-700", label: "Đang xử lý" }, 
      "shipped": { bg: "bg-cyan-100", text: "text-cyan-700", label: "Đang giao hàng" },
      "completed": { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hoàn thành" },
    };

    const config = statusMap[statusStr] || { bg: "bg-gray-100", text: "text-gray-700", label: statusStr };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      setOrders(res);
    } catch (err) {
      console.error(err);
      toast.error("Lấy danh sách đơn hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      const details = await getOrderDetailsForAdmin(order.orderId);

      setSelectedOrder({
        ...order,
        orderDetails: (details || []).map((d: any) => {
          const prodInfo = d.productVariant?.product || d.product;
          return {
            orderDetailId: d.orderDetailId,
            productId: prodInfo?.id || 0,
            productName: prodInfo?.name ?? "Sản phẩm đã xóa",
            quantity: d.quantity,
            unitPrice: d.unitPrice ?? d.productVariant?.price ?? prodInfo?.price ?? 0,
          };
        }),
      });

      const pay = await getPaymentByOrderId(order.orderId);
      setPayment(pay ?? null);

      if (pay?.promoId) {
        const promo = await getPromotionById(pay.promoId);
        setPromotion(promo ?? null);
      } else {
        setPromotion(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lấy chi tiết đơn hàng thất bại");
      setSelectedOrder(order);
      setPayment(null);
      setPromotion(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý Đơn hàng</h1>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
            Tổng số: <span className="font-bold text-blue-600">{orders.length}</span> đơn hàng
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Mã Đơn</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Ngày Đặt</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-right">Tổng Tiền</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Trạng Thái</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length > 0 ? (
                    orders.map((o) => (
                      <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-800">#{o.orderId}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(o.orderDate).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4 text-sm font-bold text-red-600 text-right">
                          {o.totalAmount.toLocaleString()}₫
                        </td>
                        <td className="p-4 text-center">
                          {getStatusBadge(o.orderStatus)}
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                          <button
                            className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors"
                            onClick={() => viewOrderDetails(o)}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-colors"
                            onClick={async () => {
                              if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${o.orderId}? Hành động này không thể hoàn tác!`)) return;
                              try {
                                await deleteOrder(o.orderId);
                                toast.success("Xóa đơn hàng thành công");
                                fetchOrders();
                              } catch (err) {
                                toast.error("Xóa đơn hàng thất bại");
                              }
                            }}
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Chưa có đơn hàng nào trong hệ thống.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in-up">

              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">
                  Chi tiết đơn hàng <span className="text-blue-600">#{selectedOrder.orderId}</span>
                </h2>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setPayment(null);
                    setPromotion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-white flex flex-col md:flex-row gap-6">

                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-3 uppercase text-sm tracking-wider">Danh sách sản phẩm</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-3 font-semibold text-gray-600">Sản phẩm</th>
                          <th className="p-3 font-semibold text-gray-600 text-center">SL</th>
                          <th className="p-3 font-semibold text-gray-600 text-right">Đơn giá</th>
                          <th className="p-3 font-semibold text-gray-600 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.orderDetails.map((item) => (
                          <tr key={item.orderDetailId} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-800 font-medium">{item.productName}</td>
                            <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                            <td className="p-3 text-right text-gray-600">{(item.unitPrice ?? 0).toLocaleString()}₫</td>
                            <td className="p-3 text-right text-red-600 font-semibold">
                              {(item.unitPrice! * item.quantity).toLocaleString()}₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <p className="text-gray-500 text-sm">Tổng cộng:</p>
                    <p className="text-2xl font-bold text-red-600">{selectedOrder.totalAmount.toLocaleString()}₫</p>
                  </div>
                </div>

                <div className="w-full md:w-1/3 flex flex-col gap-4">
                  {payment ? (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        Thông tin thanh toán
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Trạng thái:</span>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phương thức:</span>
                          <span className="font-semibold text-gray-800">{payment.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cần thu:</span>
                          <span className="font-bold text-red-600">{(payment.amount ?? 0).toLocaleString()}₫</span>
                        </div>
                        <div className="pt-2 border-t border-blue-100">
                          <span className="text-gray-500 block mb-1">Địa chỉ giao hàng:</span>
                          <span className="font-medium text-gray-800 break-words">{payment.address}</span>
                        </div>
                      </div>

                      {(String(payment.status).toLowerCase() === "pending" || String(payment.status) === "0") && (
                        <button
                          disabled={updating}
                          className="mt-5 w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          onClick={async () => {
                            if (!confirm("Xác nhận đánh dấu đơn hàng này đã thanh toán thành công?")) return;
                            try {
                              setUpdating(true);
                              await updatePaymentStatus(payment.paymentId, "Paid");
                              toast.success("Đã cập nhật trạng thái thanh toán");

                              await fetchOrders();
                              const pay = await getPaymentByOrderId(selectedOrder!.orderId);
                              setPayment(pay);
                            } catch (err) {
                              toast.error("Cập nhật thanh toán thất bại");
                            } finally {
                              setUpdating(false);
                            }
                          }}
                        >
                          {updating ? "Đang xử lý..." : "Xác nhận Đã Thanh Toán"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-gray-500 text-sm">
                      Khách hàng chưa tiến hành tạo thanh toán cho đơn hàng này.
                    </div>
                  )}

                  {promotion && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <h3 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Khuyến mãi áp dụng
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-mono bg-white px-2 py-1 rounded text-green-700 border border-green-200">
                          {promotion.code}
                        </span>
                        <span className="font-bold text-red-500">-{promotion.discountPercent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  onClick={() => {
                    setSelectedOrder(null);
                    setPayment(null);
                    setPromotion(null);
                  }}
                >
                  Đóng cửa sổ
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}