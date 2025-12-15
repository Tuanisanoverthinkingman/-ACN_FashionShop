"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getById, getByCategoryId, Product } from "@/services/product-services";
import { addToCart } from "@/services/cart-services";
import { toast } from "react-toastify";
import { FaShoppingCart } from "react-icons/fa";
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

  // Lấy thông tin sản phẩm, sản phẩm liên quan và promotion
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await getById(Number(id));
        setProduct(data || null);

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

  // --- Tính giá giảm ---
  const getDiscountedPrice = (product: Product) => {
    const applicablePromos = promotions.filter(promo => {
      switch (promo.applyType) {
        case PromotionApplyType.General:
          return false; // đổi true nếu muốn áp dụng tất cả sản phẩm
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

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      toast.success("Đã thêm vào giỏ hàng 🎉");
      window.dispatchEvent(new Event("cartChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại 😢");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải sản phẩm...</p>;
  if (!product) return <p className="text-center mt-10 text-red-500">Sản phẩm không tồn tại 😢</p>;

  const discountedPrice = getDiscountedPrice(product);
  const hasDiscount = discountedPrice < product.price;

  return (
    <div className="bg-gray-100 pt-20 font-['Poppins'] min-h-screen">
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Main product */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row gap-8">
          {/* Hình ảnh */}
          <div className="flex-1 flex justify-center items-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full max-w-sm rounded-2xl border border-gray-200 object-cover shadow-sm"
            />
          </div>

          {/* Thông tin sản phẩm */}
          <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-3xl font-extrabold mb-2">
              {hasDiscount ? (
                <>
                  <span className="line-through text-gray-400 mr-2">{product.price.toLocaleString()} ₫</span>
                  <span className="text-red-500">{discountedPrice.toLocaleString()} ₫</span>
                </>
              ) : (
                <span className="text-blue-400">{product.price.toLocaleString()} ₫</span>
              )}
            </p>
            <p className="text-gray-600 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {product.description}
            </p>
            <p className="text-gray-500 font-medium">Còn lại: {product.instock}</p>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full flex rounded-lg overflow-hidden border border-gray-300 hover:shadow-md transition disabled:opacity-50"
            >
              <span className="flex-[3] bg-white px-4 py-2 text-black font-semibold text-center">
                Thêm vào giỏ hàng
              </span>
              <span className="flex-[1] bg-blue-400 text-white flex items-center justify-center">
                <FaShoppingCart />
              </span>
            </button>
          </div>
        </div>

        {/* Sản phẩm liên quan */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {related.map((item) => {
                const relatedDiscountedPrice = getDiscountedPrice(item);
                const relatedHasDiscount = relatedDiscountedPrice < item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/product/${item.id}`)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="font-bold mt-1">
                        {relatedHasDiscount ? (
                          <>
                            <span className="line-through text-gray-400 mr-1">{item.price.toLocaleString()}₫</span>
                            <span className="text-red-500">{relatedDiscountedPrice.toLocaleString()}₫</span>
                          </>
                        ) : (
                          <span className="text-blue-400">{item.price.toLocaleString()}₫</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-12">
          <Feedback productId={product.id} currentUserId={currentUserId} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
