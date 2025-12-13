"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { Product, getAll as getProducts } from "@/services/product-services";
import { Category, getAllCategories } from "@/services/category-services";
import { addToCart } from "@/services/cart-services";

export default function ProductBanner() {
  const PRODUCTS_PER_PAGE = 12;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"default" | "price-asc" | "price-desc">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lấy sản phẩm + danh mục
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoryData] = await Promise.all([getProducts(), getAllCategories()]);
        setProducts(productData || []);
        setCategories(categoryData || []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Filter + Search + Sort ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === parseInt(selectedCategory));
    }

    if (searchTerm.trim() !== "") {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "price-desc") result.sort((a, b) => b.price - a.price);

    return result;
  }, [products, selectedCategory, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return window.location.href = "/login";

      await addToCart({ productId, quantity: 1 });
      window.dispatchEvent(new Event("cartChanged"));
    } catch {
      alert("😢 Thêm vào giỏ hàng thất bại");
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 font-['Times_New_Roman']">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
            <div key={idx} className="h-80 bg-gray-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50 font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Tất cả sản phẩm</h2>

        {/* Filter + Search + Sort */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-full border ${
                selectedCategory === "all"
                  ? "bg-blue-400 text-white"
                  : "bg-white hover:bg-blue-50 text-gray-700"
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
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-blue-50 text-gray-700"
                } transition`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              id="search"
              type="text"
              placeholder="🔍 Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 italic">
            Không có sản phẩm nào phù hợp 🥺
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col"
              >
                <Link href={`/product/${product.id}`}>
                  <img
                    src={product.imageUrl || "/images/default.jpg"}
                    alt={product.name}
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-5 flex flex-col">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-3">
                      {product.description || "Không có mô tả."}
                    </p>
                    <p className="text-xl font-bold text-gray-800 mb-3">
                      {product.price?.toLocaleString()}₫
                    </p>
                  </div>
                </Link>

                <div className="px-5 pb-5 mt-auto">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="w-full flex rounded-lg overflow-hidden border border-gray-300 hover:shadow-md transition"
                  >
                    <span className="flex-[3] bg-white px-4 py-2 text-black font-semibold text-center">
                      Thêm vào giỏ hàng
                    </span>
                    <span className="flex-[1] bg-blue-400 text-white flex items-center justify-center">
                      <FaShoppingCart />
                    </span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-4 py-2 border rounded-full disabled:opacity-50 hover:bg-blue-50 transition"
            >
              Trang trước
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-4 py-2 border rounded-full ${
                  currentPage === idx + 1 ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                } transition`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-4 py-2 border rounded-full disabled:opacity-50 hover:bg-blue-50 transition"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
