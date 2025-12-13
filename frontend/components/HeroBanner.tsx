"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAll, Product as ProductAPI } from "@/services/product-services";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ProductHero {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

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

const SlideContent = ({ product, isActive }: { product: ProductHero; isActive: boolean }) => (
  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-[90%] flex flex-col justify-center px-6 md:px-12 text-white z-20">
    <motion.span
      className="text-xl md:text-2xl font-light tracking-wide text-shadow-md"
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
      className="text-3xl md:text-5xl font-extrabold mt-3 md:mt-5 mb-4 md:mb-6 text-shadow-lg"
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
      className="text-2xl md:text-3xl font-semibold mb-6 text-shadow-md"
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
        className="inline-block text-base md:text-lg font-medium text-white border-2 border-white px-6 md:px-8 py-2 md:py-3 rounded-lg shadow-md hover:bg-white hover:text-black hover:shadow-lg transition-all duration-300"
      >
        🛍️ Xem chi tiết
      </Link>
    </motion.div>
  </div>
);

export default function HeroBanner() {
  const [products, setProducts] = useState<ProductHero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leftInterval, setLeftInterval] = useState<number | null>(null);
  const [rightInterval, setRightInterval] = useState<number | null>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: ProductAPI[] | undefined = await getAll();
        if (data && data.length > 0) {
          setProducts(
            data.slice(0, 5).map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              imageUrl: p.imageUrl || null,
            }))
          );
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
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 10000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        className="h-full relative"
        onSwiper={(swiper) => (swiperRef.current = swiper)}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="relative">
            <img
              src={product.imageUrl || "/images/banner/banner-01.jpg"}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <SlideContent product={product} isActive={true} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Hover area wrapper */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {/* Hover trái */}
        <div
          className="absolute left-0 top-0 h-full w-[5%] cursor-pointer hover:bg-black/20 pointer-events-auto"
          onMouseEnter={() => {
            if (leftInterval) window.clearInterval(leftInterval);
            const interval = window.setInterval(() => swiperRef.current?.slidePrev(500), 1500);
            setLeftInterval(interval);
          }}
          onMouseLeave={() => {
            if (leftInterval) {
              window.clearInterval(leftInterval);
              setLeftInterval(null);
            }
          }}
        ></div>

        {/* Hover phải */}
        <div
          className="absolute right-0 top-0 h-full w-[5%] cursor-pointer hover:bg-black/20 pointer-events-auto"
          onMouseEnter={() => {
            if (rightInterval) window.clearInterval(rightInterval);
            const interval = window.setInterval(() => swiperRef.current?.slideNext(500), 1500);
            setRightInterval(interval);
          }}
          onMouseLeave={() => {
            if (rightInterval) {
              window.clearInterval(rightInterval);
              setRightInterval(null);
            }
          }}
        ></div>
      </div>

      <style jsx global>{`
        * {
          font-family: "Times New Roman", Times, serif !important;
        }
        .swiper-button-next,
        .swiper-button-prev {
          color: #fff;
          background-color: rgba(0, 0, 0, 0.2);
          width: 35px;
          height: 35px;
          border-radius: 50%;
          transition: all 0.3s;
          z-index: 60;
        }
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background-color: rgba(0, 0, 0, 0.4);
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 16px;
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
        .text-shadow-md {
          text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.7);
        }
        .text-shadow-lg {
          text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </section>
  );
}
