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

  // --- Load cart + promotions ---
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

        const mappedCart = cartData.map((item: any) => ({
          cartItemId: item.cartItemId,
          quantity: item.quantity,
          product: item.product
            ? {
              id: item.product.id,
              name: item.product.name,
              imageUrl: item.product.imageUrl,
              price: item.product.price,
              categoryId: item.product.categoryId,
            }
            : undefined,
        }));

        setCartItems(mappedCart);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Tính giá giảm cho 1 sản phẩm ---
  // --- Tính giá giảm của sản phẩm (chỉ product/category, ưu tiên product) ---
  const getDiscountedPrice = (product: CartProduct | undefined) => {
    if (!product) return 0;

    // Promo áp dụng theo product
    const productPromo = promotions.find(
      p => p.applyType === PromotionApplyType.Product && p.productIds?.includes(product.id)
    );
    if (productPromo) {
      return Math.round(product.price * (1 - productPromo.discountPercent / 100));
    }

    // Promo áp dụng theo category (nếu không có promo theo product)
    const categoryPromo = promotions.find(
      p => p.applyType === PromotionApplyType.Category && p.categoryIds?.includes(product.categoryId || -1)
    );
    if (categoryPromo) {
      return Math.round(product.price * (1 - categoryPromo.discountPercent / 100));
    }

    // Không có promo
    return product.price;
  };

  // --- Chỉnh số lượng ---
  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartQuantity({ cartItemId, quantity: newQuantity });
      const data = await getCart();
      setCartItems(data.map((item: any) => ({
        cartItemId: item.cartItemId,
        quantity: item.quantity,
        product: item.product
          ? {
            id: item.product.id,
            name: item.product.name,
            imageUrl: item.product.imageUrl,
            price: item.product.price,
            categoryId: item.product.categoryId,
          }
          : undefined,
      })));
      // --- Cập nhật NavBar ---
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Xóa sản phẩm ---
  const handleDelete = async (cartItemId: number) => {
    try {
      await deleteFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      setSelectedItems(prev => prev.filter(id => id !== cartItemId));
      // --- Cập nhật NavBar ---
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Chọn sản phẩm ---
  const handleSelectItem = (cartItemId: number, checked: boolean) => {
    setSelectedItems(prev => (checked ? [...prev, cartItemId] : prev.filter(id => id !== cartItemId)));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedItems(checked ? cartItems.map(item => item.cartItemId) : []);
  };

  // --- Thanh toán ---
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }
    try {
      const order = await createOrder(selectedItems);
      toast.success("Tạo đơn hàng thành công!");
      setSelectedItems([]);
      setSelectAll(false);
      const data = await getCart();
      setCartItems(data.map((item: any) => ({
        cartItemId: item.cartItemId,
        quantity: item.quantity,
        product: item.product
          ? {
            id: item.product.id,
            name: item.product.name,
            imageUrl: item.product.imageUrl,
            price: item.product.price,
            categoryId: item.product.categoryId,
          }
          : undefined,
      })));
      // --- Cập nhật NavBar ---
      window.dispatchEvent(new Event("cartChanged"));
      router.push(`/checkout/${order.orderId}`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Thanh toán thất bại, vui lòng thử lại!");
    }
  };

  // --- Tổng tiền ---
  const totalPrice = cartItems
    .filter(item => selectedItems.includes(item.cartItemId))
    .reduce((sum, item) => sum + getDiscountedPrice(item.product) * item.quantity, 0);

  if (loading) return <div className="pt-[90px] text-center mt-10">Đang tải giỏ hàng...</div>;
  if (cartItems.length === 0) return <div className="pt-[90px] text-center mt-10">Giỏ hàng trống 😢</div>;

  return (
    <div className="pt-[90px] bg-white max-w-7xl mx-auto px-6 py-8 min-h-screen">
      <div className="px-4 py-2 flex justify-between items-center mb-6 rounded border border-gray-200 bg-gray-50">
        <h1 className="text-3xl text-gray-800 font-bold">Giỏ hàng của bạn 🛒</h1>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)} className="w-5 h-5 cursor-pointer" />
        <label className="text-gray-700 font-medium">Chọn tất cả</label>
      </div>

      <div className="flex flex-col gap-4">
        {cartItems.map(item => (
          <div key={item.cartItemId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition bg-gray-50">
            <input type="checkbox" checked={selectedItems.includes(item.cartItemId)} onChange={e => handleSelectItem(item.cartItemId, e.target.checked)} className="w-5 h-5 cursor-pointer" />
            <img src={item.product?.imageUrl || "/images/default.jpg"} alt={item.product?.name || "Sản phẩm"} className="w-24 h-24 object-cover rounded" />
            <div className="flex-1">
              <h2 className="font-semibold text-gray-800">{item.product?.name}</h2>
              {getDiscountedPrice(item.product) < (item.product?.price || 0) ? (
                <p>
                  <span className="line-through text-gray-400 mr-2">{(item.product?.price || 0).toLocaleString()} VNĐ</span>
                  <span className="text-red-500 font-bold">{getDiscountedPrice(item.product).toLocaleString()} VNĐ</span>
                </p>
              ) : (
                <p className="text-gray-700">{(item.product?.price || 0).toLocaleString()} VNĐ</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">-</button>
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
                onBlur={() =>
                  handleQuantityChange(item.cartItemId, item.quantity)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleQuantityChange(item.cartItemId, item.quantity);
                    e.currentTarget.blur();
                  }
                }}
                className="w-14 text-center border rounded px-1 py-0.5"
              />

              <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">+</button>
            </div>
            <button onClick={() => handleDelete(item.cartItemId)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">Xóa</button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center p-4 border-t bg-gray-50">
        <span className="font-bold text-lg text-gray-800">
          Tổng tiền: {totalPrice.toLocaleString()} VNĐ
        </span>
        <button onClick={handleCheckout} className="px-6 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition">
          Thanh toán
        </button>
      </div>
    </div>
  );
}
