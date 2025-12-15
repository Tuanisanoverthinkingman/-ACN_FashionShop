"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaShoppingCart } from "react-icons/fa";
import { getByCategoryId, Product } from "@/services/product-services";
import { addToCart } from "@/services/cart-services";
import { createOrder } from "@/services/order-services";
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
        toast.error("Không tải được sản phẩm 😢");
      } finally {
        setLoading(false);
      }
    };
    if (categoryId) fetchData();
  }, [categoryId]);

  // --- Tính giá giảm ---
  const getDiscountedPrice = (product: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General:
          return false; // General áp dụng cho tất cả sản phẩm
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

  // --- Filter + Search + Sort ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim() !== "") {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortOption === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (sortOption === "price-desc") result.sort((a, b) => b.price - a.price);

    return result;
  }, [products, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // --- Thêm vào giỏ ---
  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart({ productId, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng 🎉");
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thêm vào giỏ hàng thất bại 😢");
    }
  };

  // --- Mua ngay ---
  const handleBuyNow = async (productId: number) => {
    try {
      const cartItem = await addToCart({ productId, quantity: 1 });
      const cartItemId = cartItem.cartItemId;
      if (!cartItemId) return toast.error("Không lấy được CartItemId 😢");

      const order = await createOrder([cartItemId]);
      toast.success("Tạo đơn hàng thành công 🎉");
      window.dispatchEvent(new Event("cartChanged"));
      router.push(`/checkout/${order.orderId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tạo đơn hàng thất bại 😢");
    }
  };

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
    <section className="pt-[120px] pb-32 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Danh mục sản phẩm</h2>

        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-gray-50 z-10 px-4 py-2 rounded-lg shadow-sm">
          <input
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

        {/* Product Grid */}
        {currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 italic">Không có sản phẩm nào phù hợp 🥺</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentProducts.map(product => {
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

                  <div className="px-5 pb-5 mt-auto flex flex-col gap-2">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="w-full flex rounded-lg overflow-hidden border border-gray-300 hover:shadow-md transition"
                    >
                      <span className="flex-[3] bg-white px-4 py-2 text-black font-semibold text-center">Thêm vào giỏ hàng</span>
                      <span className="flex-[1] bg-blue-400 text-white flex items-center justify-center"><FaShoppingCart /></span>
                    </button>
                    <button
                      onClick={() => handleBuyNow(product.id)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Mua ngay 💳
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
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
                className={`px-4 py-2 border rounded-full ${currentPage === idx + 1 ? "bg-blue-600 text-white" : "hover:bg-blue-50"} transition`}
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
