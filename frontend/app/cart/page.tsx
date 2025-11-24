"use client";

import { useEffect, useState } from "react";
import { getCart, updateQuantity, deleteCart } from "@/services/cart-services";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const items = await getCart();
        setCart(items);
        setSelectedItems(items.map((i) => i.product.id));
      } catch (err) {
        console.error("Lỗi tải giỏ hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateLocalQuantity = (productId: number, newQty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleIncrease = async (productId: number, quantity: number) => {
    const newQty = quantity + 1;
    updateLocalQuantity(productId, newQty);
    await updateQuantity({ productId, quantity: newQty });
  };

  const handleDecrease = async (productId: number, quantity: number) => {
    const newQty = Math.max(1, quantity - 1);
    updateLocalQuantity(productId, newQty);
    await updateQuantity({ productId, quantity: newQty });
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setSelectedItems((prev) => prev.filter((id) => id !== productId));

    await deleteCart(productId);
  };

  const toggleSelect = (productId: number) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const allSelected = selectedItems.length === cart.length;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedItems([]);
    else setSelectedItems(cart.map((i) => i.product.id));
  };

  const totalPrice = cart
    .filter((item) => selectedItems.includes(item.product.id))
    .reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-400 animate-pulse text-lg">
        Đang tải giỏ hàng...
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto mt-24 px-4 pb-40 font-['Inter']">
      <h1 className="text-2xl font-bold mb-4">Giỏ hàng</h1>

      {cart.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow mb-4">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-5 h-5 accent-orange-500"
          />
          <span className="font-medium">Chọn tất cả ({cart.length})</span>
        </div>
      )}

      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center bg-white p-4 rounded-xl shadow"
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(item.product.id)}
              onChange={() => toggleSelect(item.product.id)}
              className="w-5 h-5 mr-4 accent-orange-500"
            />

            <div className="w-20 h-20 rounded-lg overflow-hidden border">
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 ml-4">
              <p className="font-medium leading-tight text-[15px]">
                {item.product.name}
              </p>

              <span className="text-red-600 font-semibold text-lg mt-1 block">
                {item.product.price.toLocaleString()} đ
              </span>

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => handleDecrease(item.product.id, item.quantity)}
                  className="w-8 h-8 border rounded-md flex items-center justify-center"
                >
                  -
                </button>

                <span className="w-8 text-center">{item.quantity}</span>

                <button
                  onClick={() => handleIncrease(item.product.id, item.quantity)}
                  className="w-8 h-8 border rounded-md flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => handleDelete(item.product.id)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-xl py-4 px-6 flex items-center justify-between">
          <div className="text-gray-600 text-sm">
            Tổng thanh toán ({selectedItems.length} sản phẩm):
          </div>

          <div className="text-right">
            <p className="text-red-600 text-xl font-bold">
              {totalPrice.toLocaleString()} đ
            </p>

            {/* --- ĐÃ SỬA TẠI ĐÂY --- */}
            <button
              onClick={() => {
                const selected = cart
                  .filter((item) => selectedItems.includes(item.product.id))
                  .map((item) => ({
                    cartItemId: item.cartItemId,
                    productId: item.product.id,
                    quantity: item.quantity,
                    product: {
                      name: item.product.name,
                      imageUrl: item.product.imageUrl,
                      price: item.product.price,
                    },
                  }));

                localStorage.setItem("checkoutItems", JSON.stringify(selected));

                router.push("/checkout");
              }}
              className="bg-red-500 text-white px-6 py-2 rounded-lg mt-1 font-medium hover:bg-red-600"
            >
              Mua hàng
            </button>
            {/* ---------------------- */}
          </div>
        </div>
      )}
    </div>
  );
}
  