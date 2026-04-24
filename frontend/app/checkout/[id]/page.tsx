"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderDetailsForUser } from "@/services/orderdetail-services";
import { createPayment, createVnPayUrl } from "@/services/payment-services";
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
  // Cập nhật cấu trúc để tương thích với Backend
  productVariant?: {
    product?: {
      id: number;
      name: string;
      price?: number;
      imageUrl?: string;
      categoryId?: number;
    };
  };
  product?: {
    id: number;
    name: string;
    price?: number;
    imageUrl?: string;
    categoryId?: number;
  };
  productId?: number;
  categoryId?: number;
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

  // State & refs
  const [order, setOrder] = useState<Order | null>(null);
  const [autoPromotions, setAutoPromotions] = useState<UserPromotion[]>([]); 
  const [genPromotions, setGenPromotions] = useState<UserPromotion[]>([]);   
  const [promoId, setPromoId] = useState<number | undefined>();
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

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

  useEffect(() => {
    if (!order) return;

    const fetchPromos = async () => {
      try {
        // 1. GEN/User
        const myPromos = await getMyPromotions();
        const gen = myPromos.filter(
          p => p.applyType === PromotionApplyType.User || p.applyType === PromotionApplyType.General
        );
        setGenPromotions(gen);

        // 2. Auto Product/Category
        const prodPromoLists = await Promise.all(
          order.orderDetails.map(od => {
            const prodInfo = od.productVariant?.product || od.product;
            const actualProductId = prodInfo?.id || od.productId || 0;
            const actualCategoryId = prodInfo?.categoryId || od.categoryId;
            
            return getApplicablePromotionsForProduct(actualProductId, actualCategoryId);
          })
        );
        
        const auto = Array.from(
          new Map(prodPromoLists.flat().map(p => [p.promotionId, p])).values()
        );
        setAutoPromotions(auto);

      } catch {
        toast.error("Không tải được danh sách khuyến mãi hợp lệ");
      }
    };

    fetchPromos();
  }, [order]);

  // Product breakdown & total
  const productBreakdown = useMemo(() => {
    if (!order) return [];

    return order.orderDetails.map(od => {
      const prodInfo = od.productVariant?.product || od.product;
      const actualProductId = prodInfo?.id || od.productId || 0;
      const actualCategoryId = prodInfo?.categoryId || od.categoryId;

      // Auto promo (Product/Category)
      const autoPromo = autoPromotions.find(p => {
        if (p.applyType === PromotionApplyType.Product && p.productIds?.includes(actualProductId)) return true;
        if (p.applyType === PromotionApplyType.Category && actualCategoryId && p.categoryIds?.includes(actualCategoryId)) return true;
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

      return {
        productId: actualProductId,
        name: prodInfo?.name ?? "Sản phẩm không xác định",
        quantity: od.quantity,
        unitPrice: od.unitPrice,
        originalAmount,
        discountedAmount,
        discountPercent: totalDiscount,
      };
    });
  }, [order, autoPromotions, genPromotions, promoId]);

  const totalOriginal = productBreakdown.reduce((sum, p) => sum + p.originalAmount, 0);
  const finalAmount = productBreakdown.reduce((sum, p) => sum + p.discountedAmount, 0);

  // Handle payment
  const handlePayment = async () => {
    if (!order) return;
    if (!address.trim()) return toast.warning("Vui lòng nhập địa chỉ giao hàng!");

    setLoading(true);
    try {
      const payload: any = {
        orderId: order.orderId,
        address,
        paymentMethod,
      };
      if (promoId) payload.promoId = promoId;

      const payment = await createPayment(payload); 
      
      const createdPaymentId = payment.payment?.paymentId || payment.paymentId; // Dự phòng cấu trúc backend

      if (paymentMethod === "VNPAY") {
        if (!createdPaymentId) {
          toast.error("Không tìm thấy ID giao dịch để tạo link VNPay");
          return;
        }
        const vnPayData = await createVnPayUrl(createdPaymentId);
        if (vnPayData?.paymentUrl) {
          window.location.href = vnPayData.paymentUrl; 
          return;
        } else {
          toast.error("Tạo link VNPay thất bại");
        }
      } else {
        toast.success("Tạo đơn đặt hàng thành công!");
        router.push(`/order/${order.orderId}`);
      }

    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <div className="pt-[90px] text-center mt-10">Đang tải đơn hàng...</div>;

  return (
    <div className="pt-[90px] max-w-4xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Thanh toán đơn hàng #{order.orderId}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Chi tiết sản phẩm</h2>
        <ul className="space-y-4">
          {productBreakdown.map((item, index) => (
            <li key={`${item.productId}-${index}`} className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Số lượng: {item.quantity} | Đơn giá: {item.unitPrice.toLocaleString()}₫
                </p>
                {item.discountPercent > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                    Giảm {item.discountPercent}%
                  </span>
                )}
              </div>
              <span className="font-bold text-gray-800">{item.discountedAmount.toLocaleString()}₫</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-5">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Thông tin giao hàng</h2>
        
        <div>
          <label className="block font-medium mb-1.5 text-gray-700">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
          <input 
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
            placeholder="Nhập địa chỉ nhận hàng của bạn..."
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
          />
        </div>

        <div>
          <label className="block font-medium mb-1.5 text-gray-700">Phương thức thanh toán</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="COD">Thanh toán khi nhận hàng (COD)</option>
            <option value="VNPAY">Thanh toán qua VNPay</option>
          </select>
        </div>

        <div ref={dropdownRef} className="relative">
          <label className="block font-medium mb-1.5 text-gray-700">Mã khuyến mãi (Voucher)</label>
          <div
            className="w-full border border-gray-300 rounded-lg p-2.5 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className={promoId ? "text-blue-600 font-semibold" : "text-gray-500"}>
              {promoId
                ? genPromotions.find(p => p.promotionId === promoId)?.code
                : "-- Chọn mã khuyến mãi --"}
            </span>
            <span className="text-gray-400">▼</span>
          </div>
          
          {dropdownOpen && (
            <ul className="absolute z-10 w-full border border-gray-200 bg-white rounded-lg shadow-xl mt-2 max-h-60 overflow-auto">
              <li
                className="p-3 cursor-pointer hover:bg-blue-50 text-gray-600 border-b border-gray-100"
                onClick={() => { setPromoId(undefined); setDropdownOpen(false); }}
              >
                -- Không dùng mã khuyến mãi --
              </li>
              {genPromotions.map(p => (
                <li
                  key={p.promotionId}
                  className={`p-3 border-b border-gray-100 flex justify-between items-center ${p.isUsed ? "bg-gray-50 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"}`}
                  onClick={() => { if (!p.isUsed) { setPromoId(p.promotionId); setDropdownOpen(false); } }}
                >
                  <div>
                    <span className={`font-mono font-bold ${p.isUsed ? "text-gray-400 line-through" : "text-blue-600"}`}>{p.code}</span>
                    <span className={`ml-2 text-sm ${p.isUsed ? "text-gray-400" : "text-gray-600"}`}>Giảm {p.discountPercent}%</span>
                  </div>
                  {p.isUsed && <span className="text-xs text-red-500 font-medium border border-red-200 px-2 py-1 rounded bg-red-50">Đã dùng</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-500">Tổng tiền hàng:</p>
          <p className="text-gray-800 font-medium">{totalOriginal.toLocaleString()}₫</p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-500">Giảm giá:</p>
          <p className="text-green-600 font-medium">-{(totalOriginal - finalAmount).toLocaleString()}₫</p>
        </div>
        <div className="flex justify-between items-center border-t pt-4 mt-2">
          <p className="text-lg font-bold text-gray-800">Tổng thanh toán:</p>
          <p className="text-red-600 font-bold text-2xl">{finalAmount.toLocaleString()}₫</p>
        </div>
      </div>

      <button
        disabled={loading}
        onClick={handlePayment}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Đang xử lý...
          </>
        ) : (
          "Xác nhận Thanh Toán"
        )}
      </button>
    </div>
  );
}