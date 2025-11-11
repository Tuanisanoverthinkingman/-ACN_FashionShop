"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAll as getProducts } from "@/services/product-services";
import { getAll as getCategories } from "@/services/category-services";
import { createCart } from "@/services/cart-services";
import { motion } from "framer-motion";

export default function ProductBanner() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(productData);
        setFilteredProducts(productData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = products;

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === parseInt(selectedCategory));
    }

    if (searchTerm.trim() !== "") {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === "price-asc") {
      result = result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result = result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts([...result]);
  }, [selectedCategory, searchTerm, sortOption, products]);

  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.dispatchEvent(new Event("showLogin"));
        return;
      }

      await createCart({ productId, quantity: 1 });
      alert("Thêm vào giỏ hàng thành công! 🛒");

      // Thông báo cho Navbar cập nhật số lượng
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error("Lỗi thêm vào giỏ hàng:", err);
      alert("Thêm vào giỏ hàng thất bại 😢");
    }
  };

  return (
    <section className="py-12 bg-gray-50 font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Sản phẩm nổi bật</h2>

        {/* Bộ lọc + tìm kiếm + sắp xếp */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-full border ${
                selectedCategory === "all"
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-200"
              } transition`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`flex-shrink-0 px-4 py-2 rounded-full border ${
                  selectedCategory === cat.id.toString()
                    ? "bg-black text-white"
                    : "bg-white hover:bg-gray-200"
                } transition`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div 
            id = "search"
            className="flex flex-col md:flex-row justify-between items-center gap-4 scroll-mt-24">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Lưới sản phẩm */}
        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 italic">
            Không có sản phẩm nào phù hợp 🥺
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <Link href={`/product/${product.id}`}>
                  <img
                    src={product.imageUrl || "/images/default.jpg"}
                    alt={product.name}
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-3">
                    {product.description || "Không có mô tả."}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {product.price?.toLocaleString()}₫
                  </p>
                  <div className="mt-auto flex justify-center">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    >
                      Thêm vào giỏ hàng 🛒
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}