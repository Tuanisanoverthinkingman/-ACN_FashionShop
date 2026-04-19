"use client";

import { orderByProduct } from "@/services/order-services";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getById, getByCategoryId, Product, ProductVariant } from "@/services/product-services";
import { addToCart } from "@/services/cart-services";
import { toast } from "react-toastify";
import { FaShoppingCart, FaMoneyBillWave } from "react-icons/fa";
import Feedback from "@/components/FeedBack";
import { Promotion, PromotionApplyType, getActivePromotions } from "@/services/promotion-services";

export default function ProductPage({ currentUserId, isAdmin }: { currentUserId: number; isAdmin?: boolean }) {
  const { id } = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  // STATE MỚI: Lưu trữ Biến thể (Size) đang được chọn
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Lấy thông tin sản phẩm, sản phẩm liên quan và promotion
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await getById(Number(id));
        setProduct(data || null);
        
        // Tự động chọn Size đầu tiên (ưu tiên size còn hàng) khi vừa load xong
        if (data && data.productVariants && data.productVariants.length > 0) {
          const availableVariant = data.productVariants.find(v => v.instock > 0) || data.productVariants[0];
          setSelectedVariant(availableVariant);
        }

        if (data?.categoryId) {
          const relatedProducts = await getByCategoryId(data.categoryId);
          setRelated(relatedProducts?.filter(p => p.id !== data.id) || []);
        }

        const promoData = await getActivePromotions();
        setPromotions(promoData || []);
      } catch {
        toast.error("Không tải được thông tin sản phẩm 😢");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- Helper: Tính % giảm giá ---
  const getDiscountPercent = (p: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General: return true;
        case PromotionApplyType.Product: return promo.productIds?.includes(p.id);
        case PromotionApplyType.Category: return promo.categoryIds?.includes(p.categoryId);
        default: return false;
      }
    });
    if (applicablePromos.length === 0) return 0;
    return applicablePromos.reduce((max, promo) => Math.max(max, promo.discountPercent), 0);
  };

  // Helper cho sản phẩm liên quan (Hiển thị giá Min)
  const getMinPrice = (p: Product) => {
    if (!p.productVariants || p.productVariants.length === 0) return 0;
    return Math.min(...p.productVariants.map(v => v.price));
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      toast.warning("Vui lòng chọn kích cỡ!");
      return;
    }
    setAdding(true);
    try {
      // GỬI LÊN ID CỦA BIẾN THỂ (SIZE ĐƯỢC CHỌN)
      await addToCart({ productVariantId: selectedVariant.id, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng 🎉");
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại 😢");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !selectedVariant) {
      toast.warning("Vui lòng chọn kích cỡ!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Cần đăng nhập để mua hàng");
      router.push("/login");
      return;
    }

    try {
      // GỬI LÊN ID CỦA BIẾN THỂ (SIZE ĐƯỢC CHỌN)
      const res = await orderByProduct(selectedVariant.id, 1);
      toast.success("Mua ngay thành công 🎉");
      router.push(`/checkout/${res.orderId}`);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.warning("Phiên đăng nhập hết hạn, đăng nhập lại");
        router.push("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Mua ngay thất bại");
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg">Đang tải sản phẩm...</p>;
  if (!product) return <p className="text-center mt-10 text-red-500 text-lg">Sản phẩm không tồn tại 😢</p>;

  // Lấy giá trị từ Biến thể đang được chọn thay vì Sản phẩm gốc
  const currentPrice = selectedVariant?.price || 0;
  const currentStock = selectedVariant?.instock || 0;

  const maxDiscountPercent = getDiscountPercent(product);
  const discountedPrice = currentPrice * (1 - maxDiscountPercent / 100);
  const hasDiscount = maxDiscountPercent > 0;

  return (
    <div className="bg-gray-100 pt-20 font-['Poppins'] min-h-screen">
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Main product */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row gap-8">
          {/* Hình ảnh */}
          <div className="flex-1 flex justify-center items-start relative">
            {hasDiscount && (
              <div className="absolute top-4 left-4 sm:top-8 sm:left-8 bg-red-500 text-white text-sm md:text-base font-bold px-3 py-1 rounded-md z-10 shadow-md">
                -{maxDiscountPercent}%
              </div>
            )}
            <img
              src={product.imageUrl || "/images/default.jpg"}
              alt={product.name}
              className="w-full max-w-md rounded-2xl border border-gray-200 object-cover shadow-sm sticky top-24"
            />
          </div>

          {/* Thông tin sản phẩm */}
          <div className="flex-1 flex flex-col gap-5">
            <h1 className="text-3xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            
            <div className="pb-4 border-b border-gray-100">
              <p className="text-3xl font-extrabold flex items-center gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-red-500">{discountedPrice.toLocaleString()} ₫</span>
                    <span className="line-through text-gray-400 text-xl font-medium">{currentPrice.toLocaleString()} ₫</span>
                  </>
                ) : (
                  <span className="text-gray-900">{currentPrice.toLocaleString()} ₫</span>
                )}
              </p>
            </div>

            {/* KHU VỰC CHỌN SIZE MỚI */}
            <div className="flex flex-col gap-3 py-2">
              <span className="font-semibold text-gray-800">
                Kích thước: <span className="font-normal text-gray-600 ml-1">{selectedVariant?.size}</span>
              </span>
              <div className="flex flex-wrap gap-3">
                {product.productVariants?.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOutOfStock = variant.instock <= 0;

                  return (
                    <button
                      key={variant.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(variant)}
                      className={`min-w-[3rem] px-4 py-2 border rounded-md font-medium transition-all duration-200 
                        ${isSelected 
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-sm" 
                          : isOutOfStock 
                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through relative"
                            : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        }
                      `}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-sm font-medium mt-1">
              {currentStock > 0 
                ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Còn {currentStock} sản phẩm</span>
                : <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">Đã hết hàng</span>
              }
            </p>

            <div className="text-gray-600 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2 mt-2 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={adding || currentStock <= 0}
                className="flex-1 flex rounded-lg overflow-hidden border border-gray-300 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="w-full bg-white px-4 py-3 text-gray-800 font-semibold text-center group-hover:bg-gray-50">
                  Thêm vào giỏ
                </span>
                <span className="w-16 bg-blue-50 text-blue-600 flex items-center justify-center border-l border-gray-300 group-hover:bg-blue-100">
                  <FaShoppingCart size={20} />
                </span>
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaMoneyBillWave size={20} />
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* Sản phẩm liên quan */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              Sản phẩm tương tự
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {related.slice(0, 4).map((item) => {
                const basePrice = getMinPrice(item);
                const relatedMaxDiscountPercent = getDiscountPercent(item);
                const relatedDiscountedPrice = basePrice * (1 - relatedMaxDiscountPercent / 100);
                const relatedHasDiscount = relatedMaxDiscountPercent > 0;

                return (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col group border border-gray-100"
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    {relatedHasDiscount && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                        -{relatedMaxDiscountPercent}%
                      </div>
                    )}
                    <div className="overflow-hidden bg-gray-50">
                      <img
                        src={item.imageUrl || "/images/default.jpg"}
                        alt={item.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                      <div className="mt-auto pt-2">
                        <p className="font-bold flex flex-wrap items-center gap-x-2">
                          {relatedHasDiscount ? (
                            <>
                              <span className="text-red-500">{relatedDiscountedPrice.toLocaleString()}₫</span>
                              <span className="line-through text-gray-400 text-xs sm:text-sm font-normal">{basePrice.toLocaleString()}₫</span>
                            </>
                          ) : (
                            <span className="text-gray-900">{basePrice.toLocaleString()}₫</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-16 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <Feedback productId={product.id} currentUserId={currentUserId} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}