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

  // Memoize merged data để tránh tính toán lại
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
    <section className="w-full py-10 bg-gray-50 font-['Times_New_Roman']">
      <h2 className="text-3xl font-bold text-center mb-6">
        Danh mục sản phẩm
      </h2>

      <div className="max-w-6xl mx-auto">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={4}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-10"
        >
          {mergedCategories.map((cat) => (
            <SwiperSlide key={cat.id}>
              <Link href={`/category/${cat.id}`} className="block group">
                <div className="flex flex-col h-[300px] justify-between rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name || "Category image"}
                    loading="lazy"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-4 flex-grow flex items-center justify-center text-center">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-2 h-[48px] group-hover:text-gray-600 transition-colors duration-300">
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
  );
}
