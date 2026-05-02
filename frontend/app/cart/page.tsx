"use client";

import { useEffect, useState } from "react";
import { getCart, updateCartQuantity, deleteFromCart } from "@/services/cart-services";
import { createOrder } from "@/services/order-services";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Promotion,
  getActivePromotions,
  PromotionApplyType
} from "@/services/promotion-services";
import {
  UserPromotion,
  getAvailablePromotions
} from "@/services/user-promo-services";

interface CartProduct {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  categoryId?: number;
}

interface CartItem {
  cartItemId: number;
  quantity: number;
  product?: CartProduct;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userPromotions, setUserPromotions] = useState<UserPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const router = useRouter();

  const formatCartData = (data: any): CartItem[] => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => {
      const price = item.variant?.price || item.product?.price || 0;

      const prodInfo = item.product;

      return {
        cartItemId: item.cartItemId,
        quantity: item.quantity,
        product: prodInfo
          ? {
            id: prodInfo.id,
            name: prodInfo.name,
            imageUrl: prodInfo.imageUrl,
            price: price,
            categoryId: prodInfo.categoryId,
          }
          : undefined,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promoData, userPromoData, cartData] = await Promise.all([
          getActivePromotions(),
          getAvailablePromotions(),
          getCart(),
        ]);

        setPromotions(promoData || []);
        setUserPromotions(userPromoData || []);

        setCartItems(formatCartData(cartData));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDiscountedPrice = (product: CartProduct | undefined) => {
    if (!product) return 0;

    let maxDiscount = 0;

    promotions.forEach(promo => {
      let isApplicable = false;

      if (promo.applyType === PromotionApplyType.General) {
        isApplicable = true;
      }
      else if (promo.applyType === PromotionApplyType.Product) {
        if (promo.productIds?.includes(product.id)) {
          isApplicable = true;
        }
      }
      else if (promo.applyType === PromotionApplyType.Category) {
        if (promo.categoryIds?.includes(product.categoryId ?? -1)) {
          isApplicable = true;
        }
      }

      if (isApplicable && promo.discountPercent > maxDiscount) {
        maxDiscount = promo.discountPercent;
      }
    });

    return Math.round(product.price * (1 - maxDiscount / 100));
  };

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartQuantity({ cartItemId, quantity: newQuantity });
      const data = await getCart();
      setCartItems(formatCartData(data));
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (cartItemId: number) => {
    try {
      await deleteFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      setSelectedItems(prev => prev.filter(id => id !== cartItemId));

      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
    }
  };
  const handleSelectItem = (cartItemId: number, checked: boolean) => {
    setSelectedItems(prev => (checked ? [...prev, cartItemId] : prev.filter(id => id !== cartItemId)));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedItems(checked ? cartItems.map(item => item.cartItemId) : []);
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      toast.warn("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }
    try {
      const order = await createOrder(selectedItems);
      toast.success("Tạo đơn hàng thành công!");
      setSelectedItems([]);
      setSelectAll(false);

      const data = await getCart();
      setCartItems(formatCartData(data));

      window.dispatchEvent(new Event("cartChanged"));
      router.push(`/checkout/${order.orderId || order.order.orderId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thanh toán thất bại, vui lòng thử lại!");
    }
  };

  const totalPrice = cartItems
    .filter(item => selectedItems.includes(item.cartItemId))
    .reduce((sum, item) => sum + getDiscountedPrice(item.product) * item.quantity, 0);

  if (loading) return <div className="pt-[90px] text-center mt-10">Đang tải giỏ hàng...</div>;
  if (cartItems.length === 0) return <div className="pt-[90px] text-center mt-10 font-medium text-gray-500">Giỏ hàng của bạn đang trống</div>;

  return (
    <div className="pt-[90px] bg-white max-w-7xl mx-auto px-6 py-8 min-h-screen">
      <div className="px-4 py-3 flex justify-between items-center mb-6 rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
        <h1 className="text-2xl text-gray-800 font-bold">Giỏ hàng của bạn 🛒</h1>
      </div>

      <div className="flex items-center gap-2 mb-4 px-2">
        <input type="checkbox" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)} className="w-5 h-5 cursor-pointer accent-blue-600" />
        <label className="text-gray-700 font-medium cursor-pointer" onClick={() => handleSelectAll(!selectAll)}>Chọn tất cả sản phẩm</label>
      </div>

      <div className="flex flex-col gap-4">
        {cartItems.map(item => (
          <div key={item.cartItemId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
            <input type="checkbox" checked={selectedItems.includes(item.cartItemId)} onChange={e => handleSelectItem(item.cartItemId, e.target.checked)} className="w-5 h-5 cursor-pointer accent-blue-600" />

            <img src={item.product?.imageUrl || "/images/default.jpg"} alt={item.product?.name || "Sản phẩm"} className="w-24 h-24 object-cover rounded-lg border border-gray-100" />

            <div className="flex-1">
              <h2 className="font-semibold text-gray-800 text-lg mb-1">{item.product?.name}</h2>
              {getDiscountedPrice(item.product) < (item.product?.price || 0) ? (
                <p>
                  <span className="line-through text-gray-400 mr-2 text-sm">{(item.product?.price || 0).toLocaleString()}₫</span>
                  <span className="text-red-500 font-bold text-lg">{getDiscountedPrice(item.product).toLocaleString()}₫</span>
                </p>
              ) : (
                <p className="text-gray-700 font-bold text-lg">{(item.product?.price || 0).toLocaleString()}₫</p>
              )}
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition">-</button>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  setCartItems(prev =>
                    prev.map(ci =>
                      ci.cartItemId === item.cartItemId
                        ? { ...ci, quantity: Number(e.target.value) }
                        : ci
                    )
                  )
                }
                onBlur={() => handleQuantityChange(item.cartItemId, item.quantity)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleQuantityChange(item.cartItemId, item.quantity);
                    e.currentTarget.blur();
                  }
                }}
                className="w-12 text-center bg-transparent border-none outline-none font-medium text-gray-700"
              />
              <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition">+</button>
            </div>

            <button onClick={() => handleDelete(item.cartItemId)} className="px-4 py-2 bg-red-50 text-red-500 font-medium rounded-lg hover:bg-red-500 hover:text-white transition ml-4 border border-red-100">
              Xóa
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm sticky bottom-4">
        <div>
          <p className="text-gray-500 text-sm mb-1">Tổng thanh toán ({selectedItems.length} sản phẩm):</p>
          <span className="font-bold text-2xl text-red-600">
            {totalPrice.toLocaleString()}₫
          </span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={selectedItems.length === 0}
          className="px-8 py-3 bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          Mua Hàng
        </button>
      </div>
    </div>
  );
}