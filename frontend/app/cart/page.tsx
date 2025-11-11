"use client";

import { useEffect, useState } from "react";
import { getCart, updateQuantity, deleteCart } from "@/services/cart-services";
import LoginModal from "@/components/LoginModal";
import { useRouter } from "next/navigation";
import { div } from "framer-motion/client";

interface CartItem {
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
  };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCartItems(data);
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLogin(true);
      setLoading(false);
      return;
    }
    fetchCart();
  }, []);

  useEffect(() => {
    const handleUserChanged = () => {
      const token = localStorage.getItem("token");
      if (token) {
        setShowLogin(false);
        setLoading(true);
        fetchCart();
      }
    };
    window.addEventListener("userChanged", handleUserChanged);
    return () => window.removeEventListener("userChanged", handleUserChanged);
  }, []);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity({ productId, quantity: newQuantity });
    fetchCart();
    window.dispatchEvent(new Event("cartChanged")); // update navbar
  };

  const handleDelete = async (productId: number) => {
    await deleteCart(productId);
    fetchCart();
    window.dispatchEvent(new Event("cartChanged")); // update navbar
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + ((item.product?.price || 0) * item.quantity),
    0
  );

  if (showLogin) return <LoginModal onClose={() => setShowLogin(false)} />;
  if (loading)
  return (
    <div>
      <p className="pt-[90px] text-center mt-10">Đang tải giỏ hàng...</p>
      <button
        onClick={() => router.push("/")}
      >Thêm sản phẩm</button>
    </div>
  );
  if (cartItems.length === 0) 
  return (
    <div>
      <p className="pt-[90px] text-center mt-10">Giỏ hàng trống 😢</p>
      <button
        onClick={() => router.push("/")}
      >Thêm sản phẩm</button>
    </div>
  );
  return (
    <div className="pt-[90px] bg-gray-500 max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="px-2 py-1 flex justify-between items-center mb-6 rounded border border-white">
        <h1 className="text-3xl text-white font-bold">Giỏ hàng của bạn 🛒</h1>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Thêm sản phẩm vào giỏ +
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {cartItems.map(item => (
          <div key={item.productId} className="flex items-center gap-4 p-4 border border-white rounded-lg shadow-sm hover:shadow-md transition">
            <img
              src={item.product?.imageUrl || "/images/default.jpg"}
              alt={item.product?.name || "Sản phẩm"}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-white">{item.product?.name}</h2>
              <p className="text-white">{(item.product?.price || 0).toLocaleString()} VNĐ</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">-</button>
              <span className="text-white">{item.quantity}</span>
              <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">+</button>
            </div>
            <button onClick={() => handleDelete(item.productId)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">
              Xóa
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center p-4 border-t">
        <span className="font-bold text-lg text-white">Tổng tiền: {totalPrice.toLocaleString()} VNĐ</span>
        <button className="px-6 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 transition">
          Thanh toán
        </button>
      </div>
    </div>
  );
}