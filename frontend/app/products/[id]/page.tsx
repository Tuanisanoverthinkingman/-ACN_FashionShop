"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getById, getByCategoryId } from "@/services/product-services";
import { createCart } from "@/services/cart-services";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter(); 

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getById(Number(id));
        setProduct(data);

        if (data?.categoryId) {
          const relatedList = await getByCategoryId(data.categoryId);
          setRelated(relatedList.filter((item: any) => item.id !== data.id));
        }
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // Chuyển sang login nếu chưa đăng nhập
  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login"); // CHUYỂN ĐẾN TRANG ĐĂNG NHẬP
        return;
      }

      await createCart({ productId: product.id, quantity: 1 });

      window.dispatchEvent(
        new CustomEvent("cartChanged", { detail: { added: 1 } })
      );

      alert("Đã thêm sản phẩm vào giỏ hàng 🛒");
    } catch (err) {
      console.error(err);
      alert("Thêm vào giỏ hàng thất bại 😢");
    }
  };

  if (loading)
    return <p className="p-6 text-center text-gray-500">Đang tải...</p>;
  if (!product)
    return (
      <p className="p-6 text-center text-gray-500">
        Không tìm thấy sản phẩm 😢
      </p>
    );

  return (
    <section className="max-w-6xl mx-auto p-6 font-['Times_New_Roman']">
      {/* Chi tiết sản phẩm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-96 object-cover rounded-lg shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <p className="text-2xl font-semibold text-red-600 mb-4">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(product.price)}
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            {product.description || "Sản phẩm này chưa có mô tả."}
          </p>

          <button
            onClick={handleAddToCart}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>

      {/* Sản phẩm liên quan */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>

        {related.length === 0 ? (
          <p className="text-gray-500">Không có sản phẩm liên quan.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg shadow hover:shadow-lg transition bg-white flex flex-col"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded mb-3"
                />

                <p className="font-semibold line-clamp-2 min-h-[48px]">
                  {item.name}
                </p>

                <p className="text-red-600 font-medium mb-3">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(item.price)}
                </p>

                <Link
                  href={`/products/${item.id}`}
                  className="mt-auto block bg-black text-white text-center py-2 rounded hover:bg-gray-800 transition"
                >
                  Xem chi tiết
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
