"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaShoppingCart, FaFire } from "react-icons/fa";
import { Product, getSaleProducts } from "@/services/product-services";
import { Category } from "@/services/category-services";
import { addToCart } from "@/services/cart-services";
import { Promotion, PromotionApplyType, getActivePromotions } from "@/services/promotion-services";

export default function SalePage() {
  const params = useParams();
  const keywordArray = params.keyword as string[] | undefined;
  const keyword = keywordArray ? keywordArray[0] : ""; 

  const PRODUCTS_PER_PAGE = 12;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"default" | "price-asc" | "price-desc">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const getPageTitle = (kw: string) => {
    switch (kw) {
      case "quan-ao": return "Sale Quần Áo Ưu Đãi Khủng";
      case "ao-thun": return "Sale Áo Thun Đồng Giá";
      case "ao-so-mi": return "Sale Áo Sơ Mi Thanh Lịch";
      case "ao-khoac": return "Sale Áo Khoác Cực Chất";
      case "quan-dai": return "Sale Quần Dài Thời Trang";
      case "quan-short": return "Sale Quần Short Năng Động";
      case "phu-kien": return "Xả Kho Phụ Kiện Hàng Hiệu";
      case "gia-dac-biet": return "Sản Phẩm Giá Đặc Biệt";
      default: return "Tất Cả Sản Phẩm Khuyến Mãi";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, promoData] = await Promise.all([
          getSaleProducts(keyword),
          getActivePromotions()
        ]);
        
        setProducts(productData || []);
        setPromotions(promoData || []);

        if (productData && productData.length > 0) {
          const uniqueCategories = Array.from(
            new Map(
              productData
                .filter(p => p.category != null)
                .map(p => [p.categoryId, p.category])
            ).values()
          ) as Category[];
          setCategories(uniqueCategories);
        }
        
        setSelectedCategory("all");
        setCurrentPage(1);

      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu sale:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [keyword]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === parseInt(selectedCategory));
    }
    if (searchTerm.trim() !== "") {
      result = result.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length]);

  const getDiscountedPrice = (product: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General: return true;
        case PromotionApplyType.Product: return promo.productIds?.includes(product.id);
        case PromotionApplyType.Category: return promo.categoryIds?.includes(product.categoryId);
        default: return false;
      }
    });
    if (applicablePromos.length === 0) return product.price;

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
    const maxVisiblePages = 5; 
    const pages = [];
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4, 5, "...", totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <section className="pt-28 pb-12 bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-300 font-['Times_New_Roman'] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
            <div key={idx} className="h-80 bg-gray-200 dark:bg-[#242424] rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 pb-12 bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-300 font-['Times_New_Roman'] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Tiêu đề */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <FaFire className="text-red-500 text-3xl animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 dark:text-white uppercase tracking-wide transition-colors duration-300">
            {getPageTitle(keyword)}
          </h2>
          <FaFire className="text-red-500 text-3xl animate-pulse" />
        </div>

        {/* Các nút lọc & Search */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-full border font-semibold transition-colors duration-300 ${
                selectedCategory === "all" 
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
                className={`flex-shrink-0 px-4 py-2 rounded-full border font-semibold transition-colors duration-300 ${
                  selectedCategory === cat.id.toString() 
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
              type="text"
              placeholder="🔍 Tìm kiếm sản phẩm Sale..."
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
              <option value="price-asc">Giá Sale: Thấp đến cao</option>
              <option value="price-desc">Giá Sale: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Lưới Sản phẩm */}
        {currentProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#242424] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <p className="text-gray-500 dark:text-gray-400 text-lg italic">Hiện chưa có sản phẩm nào đang giảm giá trong mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map((product) => {
              const discountedPrice = getDiscountedPrice(product);
              const maxDiscountPercent = Math.round((1 - discountedPrice / product.price) * 100);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-[#242424] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative border border-gray-100 dark:border-gray-800"
                >
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

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2 line-clamp-2 transition-colors duration-300">{product.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-3 transition-colors duration-300">{product.description || "Không có mô tả."}</p>
                    <div className="mt-auto">
                      <p className="text-xl font-bold mb-3 flex items-center gap-2">
                        {maxDiscountPercent > 0 ? (
                          <>
                            <span className="text-red-500 dark:text-red-400">{discountedPrice.toLocaleString()}₫</span>
                            <span className="line-through text-gray-400 dark:text-gray-500 text-sm font-normal">{product.price.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span className="text-gray-800 dark:text-gray-200">{product.price.toLocaleString()}₫</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 mt-auto">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="w-full flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 hover:shadow-md transition"
                    >
                      <span className="flex-[3] bg-white dark:bg-[#1a1a1a] px-4 py-2 text-black dark:text-white font-semibold text-center hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">Thêm vào giỏ</span>
                      <span className="flex-[1] bg-blue-400 dark:bg-blue-600 text-white flex items-center justify-center transition-colors"><FaShoppingCart /></span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Phân Trang */}
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
                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500 dark:text-gray-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-4 py-2 border rounded-full font-medium transition-colors duration-300 ${
                    currentPage === page 
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