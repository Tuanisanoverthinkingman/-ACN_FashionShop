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
  status: number;
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      setOrders(res);
    } catch (err) {
      console.error(err);
      toast.error("Lấy danh sách đơn hàng thất bại");
    }
    setLoading(false);
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      const details = await getOrderDetailsForAdmin(order.orderId);

      setSelectedOrder({
        ...order,
        orderDetails: details.map((d: any) => ({
          orderDetailId: d.orderDetailId,
          productId: d.productId,
          productName: d.product?.name ?? "Sản phẩm đã xóa",
          quantity: d.quantity,
          unitPrice: d.unitPrice ?? d.product?.price ?? 0,
        })),
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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Quản lý Đơn hàng</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Order ID</th>
              <th className="border p-2">Tổng tiền</th>
              <th className="border p-2">Trạng thái</th>
              <th className="border p-2">Ngày</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId}>
                <td className="border p-2">{o.orderId}</td>
                <td className="border p-2">{o.totalAmount.toLocaleString()}₫</td>
                <td className="border p-2">
                  <span className={statusColorMap[o.orderStatus] || ""}>
                    {statusTextMap[o.orderStatus] || o.orderStatus}
                  </span>
                </td>
                <td className="border p-2">{new Date(o.orderDate).toLocaleDateString()}</td>
                <td className="border p-2 flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => viewOrderDetails(o)}
                  >
                    View
                  </button>



                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={async () => {
                      if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
                      try {
                        await deleteOrder(o.orderId);
                        toast.success("Xóa đơn thành công");
                        fetchOrders();
                      } catch (err) {
                        toast.error("Xóa đơn thất bại");
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
          <div className="bg-white p-4 rounded w-4/5 max-h-[80vh] overflow-auto">
            <h2 className="text-lg font-bold mb-2">Chi tiết đơn #{selectedOrder.orderId}</h2>

            <h3 className="font-semibold mt-2">Sản phẩm:</h3>
            <table className="w-full border mb-2">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-1">Tên SP</th>
                  <th className="border p-1">SL</th>
                  <th className="border p-1">Đơn giá</th>
                  <th className="border p-1">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.orderDetails.map((item) => (
                  <tr key={item.orderDetailId}>
                    <td className="border p-1">{item.productName}</td>
                    <td className="border p-1">{item.quantity}</td>
                    <td className="border p-1">{(item.unitPrice ?? 0).toLocaleString()}₫</td>
                    <td className="border p-1">
                      {(item.unitPrice! * item.quantity).toLocaleString()}₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payment && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h3 className="font-bold mb-2">Thông tin thanh toán</h3>

                <p>Phương thức: {payment.paymentMethod}</p>
                <p>Địa chỉ: {payment.address}</p>
                <p>Số tiền: {(payment.amount ?? 0).toLocaleString()}₫</p>

                <p>
                  Trạng thái:{" "}
                  <span
                    className={statusColorMap[paymentStatusMap[payment.status]] || ""}
                  >
                    {statusTextMap[paymentStatusMap[payment.status]]}
                  </span>
                </p>

                {promotion && (
                  <p>
                    Mã khuyến mãi: {promotion.code} (-{promotion.discountPercent}%)
                  </p>
                )}

                {/* ✅ NÚT XÁC NHẬN THANH TOÁN */}
                {paymentStatusMap[payment.status] === "Pending" && (
                  <button
                    disabled={updating}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    onClick={async () => {
                      if (!confirm("Xác nhận đánh dấu đơn hàng đã thanh toán?")) return;

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
                    Xác nhận đã thanh toán
                  </button>
                )}
              </div>
            )}


            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => {
                  setSelectedOrder(null);
                  setPayment(null);
                  setPromotion(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
