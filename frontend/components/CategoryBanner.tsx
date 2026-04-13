"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { getAllCategories, Category } from "@/services/category-services";
import { getAll as getProducts, Product } from "@/services/product-services";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function CategoryBanner() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryData, productData] = await Promise.all([
          getAllCategories(),
          getProducts(),
        ]);

        setCategories(categoryData);
        setProducts(productData || []);
      } catch (error) {
        console.error("Error fetching categories or products:", error);
      }
    };

    fetchData();
  }, []);

  const mergedCategories = useMemo(() => {
    return categories.map((cat) => {
      const firstProduct = products.find(
        (p) => Number(p.categoryId) === Number(cat.id)
      );
      return {
        ...cat,
        imageUrl: firstProduct?.imageUrl || "/images/default.jpg",
      };
    });
  }, [categories, products]);

  return (
    <>
      <style>{`
        /* ================= CÁC CHẤM TRÒN ================= */
        .swiper-pagination-dynamic .swiper-pagination-bullet {
          background-color: #9ca3af !important; 
          opacity: 0.5 !important;
          transform: scale(0.6) !important; 
          transition: all 0.3s ease;
        }
        
        /* CHÚ Ý: Đổi màu chấm active thành màu xám đậm để hiển thị tốt trên cả 2 nền sáng/tối */
        .swiper-pagination-dynamic .swiper-pagination-bullet-active {
          background-color: #6b7280 !important; 
          opacity: 1 !important;
          transform: scale(1.3) !important; 
        }

        .swiper-pagination-dynamic .swiper-pagination-bullet-active-next,
        .swiper-pagination-dynamic .swiper-pagination-bullet-active-prev,
        .swiper-pagination-dynamic .swiper-pagination-bullet-active-next-next,
        .swiper-pagination-dynamic .swiper-pagination-bullet-active-prev-prev {
          transform: scale(0.6) !important; 
          opacity: 0.5 !important;
        }

        .swiper-button-next,
        .swiper-button-prev {
          display: none !important;
        }
      `}</style>

      {/* SỬA Ở ĐÂY: Dùng bg-gray-50 cho nền sáng, dark:bg-[#1a1a1a] cho nền tối */}
      <section className="w-full py-10 bg-gray-50 dark:bg-[#1a1a1a] font-['Times_New_Roman'] transition-colors duration-300">
        
        {/* SỬA Ở ĐÂY: Chữ đen cho nền sáng, chữ trắng cho nền tối */}
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white transition-colors duration-300">
          Danh mục sản phẩm
        </h2>

        <div className="max-w-6xl mx-auto relative px-12">
          
          {/* NÚT TRÁI: Thêm dark:bg-gray-800 dark:text-white để nút đổi màu theo theme */}
          <button className="custom-prev-btn absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 hidden md:flex cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* NÚT PHẢI */}
          <button className="custom-next-btn absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 hidden md:flex cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={4}
            navigation={{
              prevEl: '.custom-prev-btn', 
              nextEl: '.custom-next-btn', 
            }}
            pagination={{ 
              clickable: true, 
              dynamicBullets: true,
              dynamicMainBullets: 1 
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }}
            className="pb-12"
          >
            {mergedCategories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <Link href={`/category/${cat.id}`} className="block group">
                  
                  {/* CARD SẢN PHẨM: Nền trắng khi sáng, nền #242424 khi tối */}
                  <div className="flex flex-col h-[300px] justify-between rounded-2xl overflow-hidden bg-white dark:bg-[#242424] shadow-md hover:shadow-xl transition-all duration-300">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name || "Category image"}
                      loading="lazy"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-100"
                    />
                    <div className="p-4 flex-grow flex items-center justify-center text-center">
                      
                      {/* CHỮ TRONG CARD: Chữ đen khi sáng, chữ xám khi tối */}
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 h-[48px] group-hover:text-gray-500 dark:group-hover:text-white transition-colors duration-300">
                        {cat.name}
                      </h3>

                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </>
  );
}