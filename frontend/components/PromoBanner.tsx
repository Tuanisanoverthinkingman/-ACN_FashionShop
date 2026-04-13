"use client";

import React, { useEffect, useState, useRef } from "react";
// Giữ nguyên các import service của bạn
import { toast } from "react-toastify";
import { getAllPromotionsForUser, getGeneralPromotions, claimPromotion, UserPromotion } from "@/services/user-promo-services";

// --- DỮ LIỆU 10 BANNER CON ---
const featureBanners = [
  { id: 1, title: "CLOUDTOUCH™", subtitle: "MỀM HƠN BẠN NGHĨ", image: "image/banner_con_1.webp" },
  { id: 2, title: "ICEVIBES™", subtitle: "MÁT MẺ THOẢI MÁI", image: "image/banner_con_2.webp" },
  { id: 3, title: "DURABLETEX™", subtitle: "CHỐNG MÀI MÒN", image: "image/banner_con_3.webp" },
  { id: 4, title: "STAYFRESH™", subtitle: "KHÁNG KHUẨN KHỬ MÙI", image: "image/banner_con_4.webp" },
  { id: 5, title: "AIRDRY™", subtitle: "NHANH KHÔ THOÁNG KHÍ", image: "image/banner_con_5.webp" },
  { id: 6, title: "FLEXFIX™", subtitle: "CÔ GIÃN, PHỤC HỒI DÁNG", image: "image/banner_con_6.webp" },
  { id: 7, title: "COLORCLOCK™", subtitle: "BỀN MÀU", image: "image/banner_con_7.webp" },
  { id: 8, title: "RAINSHIELD™", subtitle: "TRƯỢT NƯỚC, CHỐNG THẤM", image: "image/banner_con_8.webp" },
  { id: 9, title: "UV-BLOCK™", subtitle: "CHỐNG TIA UV", image: "image/banner_con_9.webp" },
  { id: 10, title: "EASYCARE™", subtitle: "ÍT NHĂN DỄ ỦI", image: "image/banner_con_10.webp" },
];

export default function PromoList() {
  const [promos, setPromos] = useState<UserPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  // --- LOGIC TỰ ĐỘNG CUỘN ĐÃ ĐƯỢC FIX LỖI DÍNH VIỀN ---
  useEffect(() => {
    const autoScrollInterval = setInterval(() => {
      if (sliderRef.current && sliderRef.current.children.length > 0) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        
        // Lấy chính xác chiều rộng thực tế của 1 thẻ + 16px khoảng cách (gap-4)
        const firstCard = sliderRef.current.children[0] as HTMLElement;
        const scrollAmount = firstCard.offsetWidth + 16; 
        
        // Dùng sai số 5px để phòng trường hợp trình duyệt làm tròn số thập phân
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
          sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 3000);

    return () => clearInterval(autoScrollInterval);
  }, []);

  // --- HÀM CUỘN BẰNG NÚT BẤM CŨNG DÙNG KÍCH THƯỚC THỰC TẾ ---
  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current && sliderRef.current.children.length > 0) {
      const firstCard = sliderRef.current.children[0] as HTMLElement;
      const scrollAmount = firstCard.offsetWidth + 16;
      sliderRef.current.scrollBy({ 
        left: direction === "left" ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  // Logic fetch promos của bạn
  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        let allPromos: UserPromotion[] = [];
        const token = localStorage.getItem("token");
        if (token) allPromos = await getAllPromotionsForUser();
        else allPromos = await getGeneralPromotions();
        setPromos(allPromos || []);
      } catch {
        toast.error("Không thể tải danh sách khuyến mãi");
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const bannerImageUrl = "/image/banner_cong_nghe_thoi_trang.webp"; 

  return (
    <div className="w-full flex flex-col">
      {/* 1. KHU VỰC BANNER LỚN PHÍA TRÊN */}
      <div className="w-full px-4 pt-4">
        <img
          src={bannerImageUrl}
          alt="Banner chính"
          className="w-full h-auto rounded-t-lg object-cover shadow-sm"
        />
      </div>

      {/* 2. KHU VỰC SLIDER (ĐÃ CHUYỂN PADDING RA NGOÀI ĐỂ KHÔNG BỊ LỆCH SNAP) */}
      {/* Tăng px-10 để nút bấm 2 bên không bị đè lên hình ảnh thẻ */}
      <div 
        className="w-full bg-white dark:bg-[#1c1e24] px-10 py-8 relative rounded-b-lg mx-4 border border-t-0 border-gray-200 dark:border-transparent transition-colors duration-300 overflow-hidden" 
        style={{ width: 'calc(100% - 2rem)' }}
      >
        
        {/* Nút cuộn trái */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-gray-600/50 hover:bg-black/20 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* Nút cuộn phải */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-gray-600/50 hover:bg-black/20 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Container chứa 10 thẻ - Đã xóa px-8 ở đây */}
        <div 
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {featureBanners.map((feature) => (
            <div 
              key={feature.id} 
              // CÔNG THỨC MỚI: 100% chiều rộng trừ đi 3 khoảng gap (3 * 1rem = 3rem), sau đó chia 4.
              // Cộng thêm snap-always để bắt buộc thẻ luôn phải dừng đúng vị trí, không trôi lấp lửng.
              className="snap-start snap-always flex-shrink-0 w-[calc((100%-3rem)/4)] flex flex-col gap-4"
            >
              {/* Hình ảnh đại diện */}
              <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>

              {/* Thông tin Text */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-base whitespace-nowrap overflow-hidden text-ellipsis">{feature.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 mb-2 uppercase whitespace-nowrap overflow-hidden text-ellipsis">{feature.subtitle}</p>
                  
                  {/* <a href="#" className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-2">
                    KHÁM PHÁ NGAY
                  </a> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}