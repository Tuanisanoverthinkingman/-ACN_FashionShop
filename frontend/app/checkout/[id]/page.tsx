"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderDetailsForUser } from "@/services/orderdetail-services";
import { createPayment } from "@/services/payment-services";
import {
  getMyPromotions,
  getApplicablePromotionsForProduct,
  UserPromotion,
  isPromoApplicable,
  PromotionApplyType
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

  // ----------------------------
  // State & refs
  // ----------------------------
  const [order, setOrder] = useState<Order | null>(null);
  const [autoPromotions, setAutoPromotions] = useState<UserPromotion[]>([]); // Product / Category
  const [genPromotions, setGenPromotions] = useState<UserPromotion[]>([]);   // GEN / User
  const [promoId, setPromoId] = useState<number | undefined>();
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ----------------------------
  // Fetch order
  // ----------------------------
  useEffect(() => {
    if (isNaN(numericOrderId)) {
      toast.error("OrderId không hợp lệ");
      router.push("/cart");
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getOrderDetailsForUser(numericOrderId);
        setOrder({ orderId: numericOrderId, orderDetails: data || [] });
      } catch {
        toast.error("Không tìm thấy đơn hàng");
        router.push("/cart");
      }
    };

    fetchOrder();
  }, [numericOrderId, router]);

  // ----------------------------
  // Fetch promotions
  // ----------------------------
  useEffect(() => {
    if (!order) return;

    const fetchPromos = async () => {
      try {
        // 1️⃣ GEN/User
        const myPromos = await getMyPromotions();
        const gen = myPromos.filter(
          p => p.applyType === PromotionApplyType.User || p.applyType === PromotionApplyType.General
        );
        setGenPromotions(gen);

        // 2️⃣ Auto Product/Category
        const prodPromoLists = await Promise.all(
          order.orderDetails.map(od => getApplicablePromotionsForProduct(od.productId, od.product?.categoryId))
        );
        const auto = Array.from(
          new Map(prodPromoLists.flat().map(p => [p.promotionId, p])).values()
        );
        setAutoPromotions(auto);

        console.log("Auto promotions:", auto);
        console.log("GEN/User promotions:", gen);

      } catch {
        toast.error("Không tải được danh sách khuyến mãi hợp lệ");
      }
    };

    fetchPromos();
  }, [order]);

  // ----------------------------
  // Filter applicable promotions
  // ----------------------------
  const applicablePromotions = useMemo(() => {
    if (!order) return [];
    return [...autoPromotions, ...genPromotions].filter(p =>
      order.orderDetails.some(od =>
        isPromoApplicable(p, od.productId, od.product?.categoryId)
      )
    );
  }, [order, autoPromotions, genPromotions]);

  // ----------------------------
  // Product breakdown & total
  // ----------------------------
  const productBreakdown = useMemo(() => {
    if (!order) return [];

    return order.orderDetails.map(od => {
      // Auto promo (Product/Category)
      const autoPromo = autoPromotions.find(p => {
        if (p.applyType === PromotionApplyType.Product && p.productIds?.includes(od.productId)) return true;
        if (p.applyType === PromotionApplyType.Category && od.product?.categoryId && p.categoryIds?.includes(od.product.categoryId)) return true;
        return false;
      });

      const autoDiscount = autoPromo ? autoPromo.discountPercent : 0;

      // GEN/User promo do user chọn
      const selectedPromo = promoId ? genPromotions.find(p => p.promotionId === promoId) : undefined;
      const genDiscount = selectedPromo ? selectedPromo.discountPercent : 0;

      // Max discount
      const totalDiscount = Math.max(autoDiscount, genDiscount);

      const originalAmount = od.unitPrice * od.quantity;
      const discountedAmount = originalAmount * (1 - totalDiscount / 100);
      console.log("OrderDetail:", od.productId, od.product?.categoryId);
      autoPromotions.forEach(p => {
        console.log("Promo:", p.promotionId, p.code, p.applyType, p.productIds, p.categoryIds);
      });

      return {
        productId: od.productId,
        name: od.product?.name ?? "",
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        originalAmount,
        discountedAmount,
        discountPercent: totalDiscount,
        autoDiscountPercent: autoDiscount,
        genDiscountPercent: genDiscount,
        appliedAutoPromo: autoPromo,
        appliedGenPromo: selectedPromo
      };
    });
  }, [order, autoPromotions, genPromotions, promoId]);

  const totalOriginal = productBreakdown.reduce((sum, p) => sum + p.originalAmount, 0);
  const finalAmount = productBreakdown.reduce((sum, p) => sum + p.discountedAmount, 0);

  // ----------------------------
  // Handle payment
  // ----------------------------
  const handlePayment = async () => {
    if (!order) return;
    if (!address) return toast.error("Vui lòng nhập địa chỉ");

    setLoading(true);
    try {
      const payload: any = {
        orderId: order.orderId,
        address,
        paymentMethod,
      };
      if (promoId) payload.promoId = promoId;

      await createPayment(payload);
      toast.success("Tạo payment thành công!");
      router.push(`/order/${order.orderId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  if (!order) return <div className="pt-[90px] text-center mt-10">Đang tải đơn hàng...</div>;

  return (
    <div className="pt-[90px] max-w-4xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Thanh toán đơn hàng #{order.orderId}</h1>

      {/* Order details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Chi tiết đơn hàng</h2>
        <ul className="space-y-4">
          {productBreakdown.map(item => (
            <li key={item.productId} className="flex justify-between border-b pb-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  SL: {item.quantity} – {item.unitPrice.toLocaleString()} VNĐ
                </p>
                {item.discountPercent > 0 && <p className="text-green-600 text-sm">Giảm {item.discountPercent}%</p>}
              </div>
              <span className="font-semibold">{item.discountedAmount.toLocaleString()} VNĐ</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">Địa chỉ nhận hàng</label>
          <input className="w-full border rounded p-2" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div>
          <label className="block font-medium mb-1">Phương thức thanh toán</label>
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

        {/* Promo dropdown */}
        <div ref={dropdownRef} className="relative">
          <label className="block font-medium mb-1">Mã khuyến mãi</label>
          <div
            className="w-full border rounded p-2 cursor-pointer flex justify-between items-center"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {promoId
              ? genPromotions.find(p => p.promotionId === promoId)?.code
              : "-- Không dùng mã --"}
            <span>▾</span>
          </div>
          {dropdownOpen && (
            <ul className="absolute z-10 w-full border bg-white rounded shadow mt-1 max-h-60 overflow-auto">
              <li
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => { setPromoId(undefined); setDropdownOpen(false); }}
              >
                -- Không dùng mã --
              </li>
              {genPromotions.map(p => (
                <li
                  key={p.promotionId}
                  className={`p-2 ${p.isUsed ? "line-through text-gray-400 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"}`}
                  onClick={() => { if (!p.isUsed) { setPromoId(p.promotionId); setDropdownOpen(false); } }}
                >
                  {p.code} – {p.discountPercent}% {p.isUsed ? "(Đã dùng)" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-right">
        <p>Tổng: {totalOriginal.toLocaleString()} VNĐ</p>
        <p className="text-red-600 font-bold text-xl">Thành tiền: {finalAmount.toLocaleString()} VNĐ</p>
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
