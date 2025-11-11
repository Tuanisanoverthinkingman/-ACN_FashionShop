"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getById } from "@/services/product-services";
import { createCart } from "@/services/cart-services";
import { createOrder } from "@/services/order-services";
import { toast } from "react-toastify";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  instock: number;
  imageUrl: string;
  categoryId: number;
}

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const data = await getById(Number(id));
        setProduct(data);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được thông tin sản phẩm 😢");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await createCart({ productId: product.id, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng 🎉");

      // thông báo cho Navbar cập nhật giỏ hàng
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thêm vào giỏ hàng thất bại 😢");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      // thêm vào giỏ hàng trước
      const cartItem = await createCart({ productId: product.id, quantity: 1 });

      // tạo order từ cartItem vừa thêm
      const order = await createOrder([cartItem.id]);

      toast.success("Tạo đơn hàng thành công 🎉");

      // thông báo cho Navbar cập nhật giỏ hàng
      window.dispatchEvent(new Event("cartChanged"));

      // chuyển đến checkout
      router.push(`/checkout/${order.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tạo đơn hàng thất bại 😢");
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Đang tải sản phẩm...</p>;
  }

  if (!product) {
    return <p className="text-center mt-10 text-red-500">Sản phẩm không tồn tại 😢</p>;
  }

  return (
    <div className="bg-gray-800 pt-20 font-['Poppins']">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-white rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Hình ảnh sản phẩm */}
            <div className="flex-1 p-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full rounded-2xl border border-gray-600"
              />
            </div>

            {/* Thông tin sản phẩm */}
            <div className="flex-1 flex flex-col gap-4 p-4">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-xl text-purple-400 font-semibold">
                {product.price.toLocaleString()} ₫
              </p>
              <p className="text-gray-300">{product.description}</p>
              <p className="text-gray-400">Còn lại: {product.instock}</p>

              {/* Nút hành động */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Thêm vào giỏ hàng 🛒
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                >
                  Mua ngay 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}