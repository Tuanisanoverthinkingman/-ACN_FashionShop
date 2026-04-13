"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { Product, getAll as getProducts } from "@/services/product-services";
import { Category, getAllCategories } from "@/services/category-services";
import { addToCart } from "@/services/cart-services";
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

  // --- Tính giá giảm cho sản phẩm ---
  const getDiscountedPrice = (product: Product) => {
    // Chỉ lấy promo áp dụng cho product này
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General:
          return false; // Nếu muốn general áp dụng cho tất cả sản phẩm, đổi thành true
        case PromotionApplyType.Product:
          return promo.productIds?.includes(product.id);
        case PromotionApplyType.Category:
          return promo.categoryIds?.includes(product.categoryId);
        default:
          return false;
      }
    });

    const maxDiscount = applicablePromos.reduce((max, promo) => Math.max(max, promo.discountPercent), 0);
    return product.price * (1 - maxDiscount / 100);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return window.location.href = "/login";

      await addToCart({ productId, quantity: 1 });
      window.dispatchEvent(new Event("cartChanged"));
    } catch {
      alert("Thêm vào giỏ hàng thất bại");
    }
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5; // Số lượng trang hiển thị tối đa ở giữa
    const pages = [];

    if (totalPages <= maxVisiblePages + 2) {
      // Nếu tổng số trang ít, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        // Đang ở những trang đầu
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Đang ở những trang cuối
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Đang ở giữa
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
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
              className={`flex-shrink-0 px-4 py-2 rounded-full border ${selectedCategory === "all" ? "bg-blue-400 text-white" : "bg-white hover:bg-blue-50 text-gray-700"} transition`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`flex-shrink-0 px-4 py-2 rounded-full border ${selectedCategory === cat.id.toString() ? "bg-blue-600 text-white" : "bg-white hover:bg-blue-50 text-gray-700"} transition`}
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
          <p className="text-center text-gray-500 italic">Không có sản phẩm nào phù hợp </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => {
              const discountedPrice = getDiscountedPrice(product);
              const hasDiscount = discountedPrice < product.price;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full"
                >
                  <Link href={`/product/${product.id}`} className="block">
                    <img
                      src={product.imageUrl || "/images/default.jpg"}
                      alt={product.name}
                      className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-3">{product.description || "Không có mô tả."}</p>
                    <div className="mt-auto">
                      <p className="text-xl font-bold text-gray-800 mb-3">
                        {hasDiscount ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">{product.price.toLocaleString()}₫</span>
                            <span className="text-red-500">{discountedPrice.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span>{product.price.toLocaleString()}₫</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 mt-auto">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="w-full flex rounded-lg overflow-hidden border border-gray-300 hover:shadow-md transition"
                    >
                      <span className="flex-[3] bg-white px-4 py-2 text-black font-semibold text-center">Thêm vào giỏ hàng</span>
                      <span className="flex-[1] bg-blue-400 text-white flex items-center justify-center"><FaShoppingCart /></span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          // Thêm flex-wrap để nếu trên mobile màn hình quá nhỏ thì nó tự rớt dòng cho gọn
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 border rounded-full disabled:opacity-50 hover:bg-blue-50 transition"
            >
              Trang trước
            </button>
            
            {getPageNumbers().map((page, idx) => (
              page === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-4 py-2 border rounded-full ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "hover:bg-blue-50 text-gray-700"
                  } transition`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
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
