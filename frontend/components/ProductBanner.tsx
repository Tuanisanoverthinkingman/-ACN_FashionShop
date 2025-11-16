"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAll as getProducts } from "@/services/product-services";
import { getAll as getCategories } from "@/services/category-services";
import { motion } from "framer-motion";
import { createCart } from "@/services/cart-services";

export default function ProductBanner() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");

  useEffect(() => {
    setMounted(true);
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
    let result = [...products];

    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.categoryId === parseInt(selectedCategory)
      );
    }

    if (searchTerm.trim() !== "") {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [selectedCategory, searchTerm, sortOption, products]);

  if (!mounted) return null;

  return (
    <section className="py-12 bg-gray-50 font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Sản phẩm nổi bật</h2>

        {/* Danh mục */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar mb-6">
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
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2 border rounded-md w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="default">Sắp xếp mặc định</option>
            <option value="price-asc">Giá: Thấp → Cao</option>
            <option value="price-desc">Giá: Cao → Thấp</option>
          </select>
        </div>

        {/* Grid sản phẩm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
              whileHover={{ scale: 1.05 }}
            >
              <Link href={`/products/${product.id}`}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-48 w-full object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600 mt-1">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </p>
              </Link>
              
              {/* Nút thêm vào giỏ hàng */}
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
                      return;
                    }
                    await createCart({ productId: product.id, quantity: 1 });

                    // Bắn CustomEvent với số lượng thêm trực tiếp
                    window.dispatchEvent(new CustomEvent("cartChanged", { detail: { added: 1 } }));

                    alert("Đã thêm sản phẩm vào giỏ hàng 🛒");
                  } catch (err) {
                    console.error(err);
                    alert("Thêm vào giỏ hàng thất bại 😢");
                  }
                }}
                className="mt-3 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Thêm vào giỏ hàng
              </button>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-gray-500">
              Không có sản phẩm nào phù hợp 😢
            </p>
          )}
        </div>
      </div>
    </section>
  );
}