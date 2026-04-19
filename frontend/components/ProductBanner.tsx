"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Product, getAll as getProducts } from "@/services/product-services";
import { Category, getAllCategories } from "@/services/category-services";
import { Promotion, PromotionApplyType, getActivePromotions } from "@/services/promotion-services";

export default function ProductBanner() {
  const PRODUCTS_PER_PAGE = 12;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"default" | "price-asc" | "price-desc">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Lấy sản phẩm, danh mục, promotion
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoryData, promoData] = await Promise.all([
          getProducts(),
          getAllCategories(),
          getActivePromotions()
        ]);
        setProducts(productData || []);
        setCategories(categoryData || []);
        setPromotions(promoData || []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Helper: Lấy giá nhỏ nhất của Sản phẩm ---
  const getMinPrice = (product: Product) => {
    if (!product.productVariants || product.productVariants.length === 0) return 0;
    return Math.min(...product.productVariants.map(v => v.price));
  };

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

    if (sortOption === "price-asc") result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    else if (sortOption === "price-desc") result.sort((a, b) => getMinPrice(b) - getMinPrice(a));

    return result;
  }, [products, selectedCategory, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // --- Tính % giảm giá lớn nhất cho sản phẩm ---
  const getDiscountPercent = (product: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General:
          return true; 
        case PromotionApplyType.Product:
          return promo.productIds?.includes(product.id);
        case PromotionApplyType.Category:
          return promo.categoryIds?.includes(product.categoryId);
        default:
          return false;
      }
    });

    if (applicablePromos.length === 0) return 0;
    return applicablePromos.reduce((max, promo) => Math.max(max, promo.discountPercent), 0);
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5; 
    const pages = [];

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-300 font-['Times_New_Roman'] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
            <div key={idx} className="h-80 bg-gray-200 dark:bg-[#242424] rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-300 font-['Times_New_Roman'] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white transition-colors duration-300">Tất cả sản phẩm</h2>

        {/* Filter + Search + Sort */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-full border font-semibold transition-colors duration-300 ${selectedCategory === "all"
                  ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  : "bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800"
                }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`flex-shrink-0 px-4 py-2 rounded-full border font-semibold transition-colors duration-300 ${selectedCategory === cat.id.toString()
                    ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                    : "bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              id="search"
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242424] text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors duration-300"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#242424] text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors duration-300"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {currentProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#242424] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-gray-500 dark:text-gray-400 text-lg italic">Không có sản phẩm nào phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => {
              const basePrice = getMinPrice(product);
              const maxDiscountPercent = getDiscountPercent(product);
              const discountedPrice = basePrice * (1 - maxDiscountPercent / 100);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-[#242424] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative border border-gray-100 dark:border-gray-800"
                >
                  {/* Badge hiển thị % giảm giá */}
                  {maxDiscountPercent > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                      -{maxDiscountPercent}%
                    </div>
                  )}

                  <Link href={`/product/${product.id}`} className="block overflow-hidden">
                    <img
                      src={product.imageUrl || "/images/default.jpg"}
                      alt={product.name}
                      className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500 bg-gray-100 dark:bg-gray-800"
                    />
                  </Link>

                  <div className="p-5 flex flex-col flex-1 pb-6">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-3 transition-colors duration-300">{product.description || "Không có mô tả."}</p>
                    <div className="mt-auto">
                      <p className="text-xl font-bold flex items-center gap-2">
                        {maxDiscountPercent > 0 ? (
                          <>
                            <span className="text-red-500 dark:text-red-400">{discountedPrice.toLocaleString()}₫</span>
                            <span className="line-through text-gray-400 dark:text-gray-500 text-sm font-normal">{basePrice.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span className="text-gray-800 dark:text-gray-200">
                            {basePrice.toLocaleString()}₫
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              Trang trước
            </button>

            {getPageNumbers().map((page, idx) => (
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500 dark:text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-4 py-2 border rounded-full font-medium transition-colors duration-300 ${currentPage === page
                      ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800"
                    }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </section>
  );
}