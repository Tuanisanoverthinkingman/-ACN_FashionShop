"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderDetailsForUser } from "@/services/orderdetail-services";
import { createPayment } from "@/services/payment-services";
import {
  getMyPromotions,
  UserPromotion,
  isPromoApplicable,
} from "@/services/user-promo-services";
import { toast } from "react-toastify";

interface OrderDetail {
  orderDetailId: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    categoryId?: number;
  };
  quantity: number;
  unitPrice: number;
}

interface Order {
  orderId: number;
  orderDetails: OrderDetail[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const numericOrderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [promotions, setPromotions] = useState<UserPromotion[]>([]);
  const [promoId, setPromoId] = useState<number | undefined>();

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  // ===============================
  // Fetch order
  // ===============================
  useEffect(() => {
    if (isNaN(numericOrderId)) {
      toast.error("OrderId không hợp lệ");
      router.push("/cart");
      return;
    }

    getOrderDetailsForUser(numericOrderId)
      .then((data) => {
        setOrder({ orderId: numericOrderId, orderDetails: data || [] });
      })
      .catch(() => {
        toast.error("Không tìm thấy đơn hàng");
        router.push("/cart");
      });
  }, [numericOrderId]);

  // ===============================
  // Fetch claimed promotions
  // ===============================
  useEffect(() => {
    getMyPromotions().then(setPromotions);
  }, []);

  // ===============================
  // Product breakdown (UI only)
  // ===============================
  const productBreakdown = useMemo(() => {
    if (!order) return [];

    const promo = promoId
      ? promotions.find((p) => p.promotionId === promoId)
      : undefined;

    return order.orderDetails.map((od) => {
      let discountPercent = 0;

      if (
        promo &&
        isPromoApplicable(promo, od.productId, od.product?.categoryId)
      ) {
        discountPercent = promo.discountPercent;
      }

      const originalAmount = od.unitPrice * od.quantity;
      const discountedAmount =
        discountPercent > 0
          ? originalAmount * (1 - discountPercent / 100)
          : originalAmount;

      return {
        productId: od.productId,
        name: od.product?.name ?? "",
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        originalAmount,
        discountedAmount,
        discountPercent,
      };
    });
  }, [order, promotions, promoId]);

  const totalOriginal = productBreakdown.reduce(
    (sum, p) => sum + p.originalAmount,
    0
  );
  const finalAmount = productBreakdown.reduce(
    (sum, p) => sum + p.discountedAmount,
    0
  );

  // ===============================
  // Handle payment
  // ===============================
  const handlePayment = async () => {
    if (!order) return;
    if (!address) return toast.error("Vui lòng nhập địa chỉ");

    if (promoId) {
      const promo = promotions.find((p) => p.promotionId === promoId);
      if (!promo)
        return toast.error("Mã khuyến mãi không hợp lệ");

      const applicable = order.orderDetails.some((od) =>
        isPromoApplicable(promo, od.productId, od.product?.categoryId)
      );

      if (!applicable){
        return toast.error(
          "Mã khuyến mãi không áp dụng cho đơn hàng này"
        );
      }
    }

    setLoading(true);
    try {
      await createPayment({
        orderId: order.orderId,
        promoId,
        address,
        paymentMethod,
      });

      toast.success("Tạo payment thành công!");
      router.push(`/order/${order.orderId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!order)
    return (
      <div className="pt-[90px] text-center mt-10">
        Đang tải đơn hàng...
      </div>
    );

  return (
    <div className="pt-[90px] max-w-4xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Thanh toán đơn hàng #{order.orderId}
      </h1>

      {/* Order details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Chi tiết đơn hàng
        </h2>

        <ul className="space-y-4">
          {productBreakdown.map((item) => (
            <li
              key={item.productId}
              className="flex justify-between border-b pb-3"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  SL: {item.quantity} – {item.unitPrice.toLocaleString()} VNĐ
                </p>

                {item.discountPercent > 0 && (
                  <p className="text-green-600 text-sm">
                    Giảm {item.discountPercent}%
                  </p>
                )}
              </div>

              <span className="font-semibold">
                {item.discountedAmount.toLocaleString()} VNĐ
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">
            Địa chỉ nhận hàng
          </label>
          <input
            className="w-full border rounded p-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            Phương thức thanh toán
          </label>
          <select
            className="w-full border rounded p-2"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="COD">COD</option>
            <option value="VNPAY">VNPAY</option>
            <option value="PAYPAL">PayPal</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">
            Mã khuyến mãi
          </label>
          <select
            className="w-full border rounded p-2"
            value={promoId ?? ""}
            onChange={(e) =>
              setPromoId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          >
            <option value="">-- Không dùng mã --</option>
            {promotions.map((p) => (
              <option key={p.promotionId} value={p.promotionId}>
                {p.code} – {p.discountPercent}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-right">
        <p>Tổng: {totalOriginal.toLocaleString()} VNĐ</p>
        <p className="text-red-600 font-bold text-xl">
          Thành tiền: {finalAmount.toLocaleString()} VNĐ
        </p>
      </div>

      <button
        disabled={loading}
        onClick={handlePayment}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold"
      >
        {loading ? "Đang xử lý..." : "Thanh toán"}
      </button>
    </div>
  );
}
