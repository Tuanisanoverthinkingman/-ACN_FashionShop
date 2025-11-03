"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAll as getProducts } from "@/services/product-services";
import { getAll as getCategories } from "@/services/category-services";
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

  // Lọc và sắp xếp sản phẩm
  useEffect(() => {
    let result = products;

    // Lọc theo danh mục
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.categoryId === parseInt(selectedCategory)
      );
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim() !== "") {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp theo giá
    if (sortOption === "price-asc") {
      result = result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result = result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts([...result]);
  }, [selectedCategory, searchTerm, sortOption, products]);

  return (
    <section className="py-12 bg-gray-50 font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4">
        {/* Tiêu đề */}
        <h2 className="text-3xl font-bold text-center mb-8">
          Sản phẩm nổi bật
        </h2>

        {/* Bộ lọc + tìm kiếm + sắp xếp */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Danh mục (cuộn ngang) */}
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

          {/* Search + Sort */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <Link href={`/product/${product.id}`}>
                  <img
                    src={product.imageUrl || "/images/default.jpg"}
                    alt={product.name}
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {product.description || "Không có mô tả."}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {product.price?.toLocaleString()}₫
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}