"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAll, Product as ProductAPI } from "@/services/product-services";

// --- Skeleton: Đổi màu theo nền Sáng/Tối ---
const HeroSkeleton = () => (
  <section className="relative bg-white dark:bg-[#1a1814] h-[85vh] py-16 px-6 font-[Times_New_Roman] animate-pulse transition-colors duration-500">
    <div className="max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[4/5] md:aspect-auto h-full"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[4/5] md:aspect-auto h-full"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[4/5] md:aspect-auto h-full"></div>
    </div>
  </section>
);

// --- Component Video Card ---
const VideoCard = ({ 
  videoSrc, title, subtitle, linkPath 
}: { 
  videoSrc: string; title: string; subtitle: string; linkPath: string 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!hasMounted) return <div className="aspect-[4/5] w-full bg-gray-200 dark:bg-gray-900 rounded-lg shadow-xl" />;

  return (
    <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden group bg-gray-200 dark:bg-gray-900 shadow-xl">
      <video
        ref={videoRef}
        key={videoSrc}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        autoPlay
        loop
        muted={isMuted}
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ video.
      </video>
      
      {/* Lớp Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 pb-14 text-center text-white z-20 pointer-events-none">
        <h3 className="text-xl md:text-2xl font-medium text-shadow-md mb-2">{title}</h3>
        <div className="flex justify-center pointer-events-auto">
          <Link href={linkPath} className="text-sm md:text-base border-b-2 border-white pb-0.5 hover:text-gray-300 transition">
            {subtitle}
          </Link>
        </div>
      </div>

      {/* --- CẬP NHẬT UI NÚT BẤM (FROSTED GLASS) --- */}
      
      {/* Nút Play/Pause */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
        <button 
          onClick={togglePlay} 
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 hover:bg-white/40 backdrop-blur-md border border-white/10 text-white shadow-lg transition-all duration-300"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> 
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 
          )}
        </button>
      </div>

      {/* Nút Âm thanh */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
        <button 
          onClick={toggleMute} 
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 hover:bg-white/40 backdrop-blur-md border border-white/10 text-white shadow-lg transition-all duration-300"
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="11" y1="5" x2="6" y2="9"></line><line x1="2" y1="9" x2="2" y2="15"></line><line x1="6" y1="15" x2="11" y2="19"></line><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> 
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg> 
          )}
        </button>
      </div>
      
    </div>
  );
};

export default function HeroBanner() {
  const [products, setProducts] = useState<ProductAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: ProductAPI[] | undefined = await getAll();
        if (data && data.length > 0) {
          setProducts(data.slice(0, 3)); 
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

  return (
    // BƯỚC 1: Đổi màu nền bao ngoài (bg-white cho sáng, dark:bg-[#1a1814] cho tối)
    <section className="relative w-full min-h-[85vh] bg-white dark:bg-[#1a1814] transition-colors duration-500 py-16 md:py-20 px-6 font-[Times_New_Roman] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Phần 1: Bố cục Grid 3 cột */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 md:mb-20 max-w-5xl mx-auto px-4 md:px-0">
          <VideoCard 
            videoSrc="/videos/Video1.mp4" 
            title="Áo Khoác Chống Nắng UPF 50+" 
            subtitle="Khám phá ngay" 
            linkPath={`/product/${products[0]?.id || 1}`} 
          />
          <VideoCard 
            videoSrc="/videos/Video2.mp4"
            title="Mặc Mát - Chống Nắng" 
            subtitle="Tay áo xỏ ngón che chắn" 
            linkPath={`/product/${products[1]?.id || 2}`} 
          />
          <VideoCard 
            videoSrc="/videos/Video3.mp4"
            title="Bộ Sưu Tập Mùa Hè" 
            subtitle="Xem tất cả" 
            linkPath="/sale" 
          />
        </div>

        {/* Phần 2: Text và Nút CTA bên dưới */}
        <div className="text-center flex flex-col items-center">
          
          {/* TIÊU ĐỀ: Đen khi Sáng, Xám Trắng khi Tối */}
          <h2 className="text-3xl md:text-4xl font-serif tracking-widest uppercase mb-4 transition-colors duration-500 text-gray-900 dark:text-[#e5e5e5]">
            Mặc che chắn, không cháy nắng
          </h2>
          
          {/* MÔ TẢ: Xám Đậm khi Sáng, Xám Nhạt khi Tối */}
          <p className="text-base md:text-lg mb-10 max-w-2xl transition-colors duration-500 text-gray-600 dark:text-gray-400">
            Mở bán siêu phẩm dành cho mùa hè
          </p>
          
          {/* NÚT BẤM: Đổi màu nền và màu hover linh hoạt */}
          <Link 
            href="/sale"
            className="text-white px-12 py-3.5 rounded-lg text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 bg-gray-900 hover:bg-gray-800 dark:bg-[#242633] dark:hover:bg-[#323546]"
          >
            Săn ưu đãi ngay
          </Link>
          
        </div>
      </div>

      <style jsx global>{`
        * {
          font-family: "Times New Roman", Times, serif !important;
        }
        .text-shadow-md {
          text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </section>
  );
}