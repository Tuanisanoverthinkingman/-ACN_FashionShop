"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getByCategoryId } from "@/services/product-services";
import { createCart } from "@/services/cart-services";
import { createOrder } from "@/services/order-services";
import { toast } from "react-toastify";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  instock: number;
  imageUrl: string;
  categoryId: number;
}

export default function CategoryPage() {
  const { id } = useParams();
  const categoryId = id ? Number(id) : null;

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) return;
      try {
        const data = await getByCategoryId(categoryId);
        setProducts(data);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được sản phẩm 😢");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  const handleAddToCart = async (productId: number) => {
    try {
      await createCart({ productId, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng 🎉");
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thêm vào giỏ hàng thất bại 😢");
    }
  };

  const handleBuyNow = async (productId: number) => {
    try {
      const cartItem = await createCart({ productId, quantity: 1 });
      const order = await createOrder([cartItem.id]);
      toast.success("Tạo đơn hàng thành công 🎉");
      window.dispatchEvent(new Event("cartChanged"));
      router.push(`/checkout/${order.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tạo đơn hàng thất bại 😢");
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Đang tải sản phẩm...</p>;
  }

  if (!products || products.length === 0) {
    return <p className="text-center mt-10 text-gray-500">Không có sản phẩm nào 🥺</p>;
  }

  return (
    <div className="bg-gray-50 pt-20 font-['Poppins']">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold mb-8 text-center">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition flex flex-col"
            >
              <Link href={`/product/${product.id}`}>
                <img
                  src={product.imageUrl || "/images/default.jpg"}
                  alt={product.name}
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500 rounded-t-2xl"
                />
              </Link>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-3">
                  {product.description || "Không có mô tả."}
                </p>
                <p className="text-lg font-bold text-gray-900 mb-2">
                  {product.price?.toLocaleString()}₫
                </p>
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                  >
                    Thêm vào giỏ hàng 🛒
                  </button>
                  <button
                    onClick={() => handleBuyNow(product.id)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  >
                    Mua ngay 💳
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}