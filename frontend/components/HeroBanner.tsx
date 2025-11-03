"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAll } from "@/services/product-services";

import { Swiper, SwiperSlide, useSwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

// 🧩 Interface cho sản phẩm
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
}

// 💰 Hàm định dạng giá tiền
const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

// 💀 Skeleton khi đang tải
const HeroSkeleton = () => (
  <section className="relative bg-gray-700 bg-center h-[85vh] animate-pulse font-[Times_New_Roman]">
    <div className="absolute inset-0 bg-black/30"></div>
    <div className="container mx-auto h-full flex flex-col justify-center items-start px-6 text-white relative z-10">
      <div className="h-8 w-1/3 bg-gray-600 rounded-md"></div>
      <div className="h-20 w-3/4 bg-gray-600 rounded-md mt-5 mb-8"></div>
      <div className="h-10 w-1/4 bg-gray-600 rounded-md mb-6"></div>
      <div className="h-14 w-48 bg-gray-600 rounded-lg"></div>
    </div>
  </section>
);

// 📸 SlideContent: nội dung cho mỗi slide
const SlideContent = ({ product }: { product: Product }) => {
  const swiperSlide = useSwiperSlide();
  const isActive = swiperSlide.isActive;

  return (
    <div className="container mx-auto h-full flex flex-col justify-center items-start px-6 text-white relative z-10 font-[Times_New_Roman]">
      <motion.span
        className="text-xl md:text-2xl font-light tracking-wide"
        variants={{
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.3 } },
        }}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
      >
        Sản phẩm nổi bật ✨
      </motion.span>

      <motion.h2
        className="text-3xl md:text-5xl font-extrabold mt-5 mb-6 text-shadow-lg"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.5 } },
        }}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
      >
        {product.name}
      </motion.h2>

      <motion.p
        className="text-3xl md:text-3xl font-semibold mb-6"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.9, delay: 0.8 } },
        }}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
      >
        {formatPrice(product.price)}
      </motion.p>

      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1, transition: { duration: 0.7, delay: 1.0 } },
        }}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
      >
        <Link
          href={`/product/${product.id}`}
          className="inline-block text-base md:text-lg font-medium text-white border-2 border-white px-8 py-3 rounded-lg shadow-md hover:bg-white hover:text-black hover:shadow-lg transition-all duration-300"
        >
          🛍️ Xem chi tiết
        </Link>
      </motion.div>
    </div>
  );
};

// --- Component Chính ---
export default function HeroSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: Product[] = await getAll();
        if (data && data.length > 0) {
          setProducts(data.slice(0, 5));
        }
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <HeroSkeleton />;
  if (products.length === 0) return null;

  return (
    <section className="relative w-full h-[85vh] font-[Times_New_Roman]">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        navigation={true}
        pagination={{ clickable: true }}
        className="h-full"
      >
        {products.map((product) => (
          <SwiperSlide
            key={product.id}
            className="relative bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                product.imageUrl || "/images/banner/banner-01.jpg"
              })`,
            }}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <SlideContent product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        * {
          font-family: "Times New Roman", Times, serif !important;
        }
        .swiper-button-next,
        .swiper-button-prev {
          color: #fff;
          background-color: rgba(0, 0, 0, 0.2);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background-color: rgba(0, 0, 0, 0.4);
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 20px;
          font-weight: 900;
        }
        .swiper-pagination-bullet {
          background-color: #ccc;
          opacity: 0.8;
          width: 10px;
          height: 10px;
          transition: all 0.3s;
        }
        .swiper-pagination-bullet-active {
          background-color: #fff;
          opacity: 1;
          transform: scale(1.2);
        }
      `}</style>
    </section>
  );
}