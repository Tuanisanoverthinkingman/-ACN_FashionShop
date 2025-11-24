"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getByCategoryId } from "@/services/product-services";

export default function CategoryPage() {
  const { id } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getByCategoryId(Number(id));
        setProducts(data);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm theo danh mục:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProducts();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 font-['Times_New_Roman']">
        Đang tải sản phẩm...
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto p-6 font-['Times_New_Roman']">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Sản phẩm thuộc danh mục
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-4">
                <p className="font-semibold mb-1">{item.name}</p>

                <p className="text-red-600 font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(item.price)}
                </p>

                <a
                  href={`/products/${item.id}`}
                  className="mt-3 block text-center bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                >
                  Xem chi tiết
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
