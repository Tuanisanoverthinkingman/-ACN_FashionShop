"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getByCategoryId, Product } from "@/services/product-services";
import { getActivePromotions, Promotion, PromotionApplyType } from "@/services/promotion-services";
import { toast } from "react-toastify";

export default function CategoryPage() {
  const PRODUCTS_PER_PAGE = 12;

  const { id } = useParams();
  const categoryId = id ? Number(id) : null;

  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"default" | "price-asc" | "price-desc">("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // --- Lấy sản phẩm + promotions ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, promoData] = await Promise.all([
          getByCategoryId(categoryId!),
          getActivePromotions()
        ]);
        setProducts(productData || []);
        setPromotions(promoData || []);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được sản phẩm");
      } finally {
        setLoading(false);
      }
    };
    if (categoryId) fetchData();
  }, [categoryId]);

  // --- Helper: Lấy giá nhỏ nhất của Sản phẩm ---
  const getMinPrice = (product: Product) => {
    if (!product.productVariants || product.productVariants.length === 0) return 0;
    return Math.min(...product.productVariants.map(v => v.price));
  };

  // --- Tính % giảm giá ---
  const getDiscountPercent = (product: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General: return true;
        case PromotionApplyType.Product: return promo.productIds?.includes(product.id);
        case PromotionApplyType.Category: return promo.categoryIds?.includes(product.categoryId);
        default: return false;
      }
    });
    if (applicablePromos.length === 0) return 0;
    return applicablePromos.reduce((max, promo) => Math.max(max, promo.discountPercent), 0);
  };

  // --- Filter + Search + Sort ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim() !== "") {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortOption === "price-asc") result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
    else if (sortOption === "price-desc") result.sort((a, b) => getMinPrice(b) - getMinPrice(a));

    return result;
  }, [products, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  if (loading) {
    return (
      <section className="pt-[120px] pb-32 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, idx) => (
            <div key={idx} className="h-80 bg-gray-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-[120px] pb-32 bg-gray-50 min-h-screen font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Danh mục sản phẩm</h2>

        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 px-4 py-2">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
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

        {/* Product Grid */}
        {currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 italic py-20">Không có sản phẩm nào phù hợp</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map(product => {
              const basePrice = getMinPrice(product);
              const discountPercent = getDiscountPercent(product);
              const discountedPrice = basePrice * (1 - discountPercent / 100);
              const hasDiscount = discountPercent > 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative border border-gray-100"
                >
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                      -{discountPercent}%
                    </div>
                  )}

                  <Link href={`/product/${product.id}`} className="block overflow-hidden">
                    <img
                      src={product.imageUrl || "/images/default.jpg"}
                      alt={product.name}
                      className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="p-5 flex flex-col flex-1 pb-8">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-3">{product.description || "Không có mô tả."}</p>
                    <div className="mt-auto">
                      <p className="text-xl font-bold flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-red-500">{discountedPrice.toLocaleString()}₫</span>
                            <span className="line-through text-gray-400 text-sm font-normal">{basePrice.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span className="text-gray-800">{basePrice.toLocaleString()}₫</span>
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
          <div className="flex justify-center gap-2 mt-12">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 border rounded-full disabled:opacity-50 hover:bg-blue-50 transition"
            >
              Trang trước
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-10 h-10 border rounded-full flex items-center justify-center transition ${
                  currentPage === idx + 1 ? "bg-blue-600 text-white border-blue-600" : "hover:bg-blue-50"
                }`}
              >
                {idx + 1}
              </button>
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