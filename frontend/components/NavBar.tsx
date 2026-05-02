"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User, ChevronDown, X, ArrowRight } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getCart } from "@/services/cart-services";
import { logout } from "@/services/auth-services";
import { quickSearch, QuickSearchResponse } from "@/services/product-services";


const NAV_MENU = [
  { name: "SALE", path: "/sale", hasDropdown: true },
  { name: "ÁO", path: "/collections/ao", hasDropdown: true },
  { name: "QUẦN", path: "/collections/quan", hasDropdown: true },
  { name: "PHỤ KIỆN", path: "/collections/phu-kien", hasDropdown: true },
];

const useUser = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkUser = () => {
      const user = localStorage.getItem("user");
      setUserName(user ? JSON.parse(user).username : null);
    };
    checkUser();
    window.addEventListener("userChanged", checkUser);
    return () => window.removeEventListener("userChanged", checkUser);
  }, []);

  return userName;
};

const useCartCount = () => {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setCartCount(0);
      const cartData = await getCart();
      setCartCount(cartData?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cartChanged", updateCartCount);
    return () => window.removeEventListener("cartChanged", updateCartCount);
  }, [updateCartCount]);

  return cartCount;
};

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const userName = useUser();
  const cartCount = useCartCount();
  const [showMenu, setShowMenu] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<QuickSearchResponse>({ categories: [], products: [] });

  const navBgClass = "bg-white dark:bg-[#1a1814] text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 shadow-sm";
  const megaMenuClass = "bg-white dark:bg-[#1a1814] border-t border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white shadow-xl";
  const titleClass = "text-gray-900 dark:text-white border-gray-200 dark:border-gray-700";
  const linkClass = "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium";
  const handleSearchScroll = () => {
    const section = document.getElementById("search");
    if (section) {
      const y = section.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        const data = await quickSearch(searchQuery);
        if (data) setSearchResults(data);
      } else {
        setSearchResults({ categories: [], products: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Click ngoài menu user
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".user-menu")) setShowMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 font-['Poppins'] transition-colors duration-500 ${navBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-[76px] flex justify-between items-center">

        {/* 1. Phần Trái: Logo */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/image/NovaLogo.png"
              alt="Logo"
              className="h-9 w-9 rounded-full object-cover shadow-sm"
            />
            <span className="text-xl md:text-2xl font-semibold tracking-wide hidden sm:block">
              <span className="font-bold">Nova</span> Store
            </span>
          </Link>
        </div>

        {/* 2. Phần Giữa: Navigation Links */}
        <div className="hidden lg:flex flex-auto justify-center items-center gap-6 h-full">
          {NAV_MENU.map((item, index) => (
            <div key={index} className="group relative h-full flex items-center">

              {/* Nút Menu chính */}
              <Link
                href={item.path}
                className="flex items-center gap-1 text-[13px] font-medium tracking-wide hover:opacity-70 transition-opacity uppercase"
              >
                {item.name}
                {item.hasDropdown && (
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                )}
              </Link>

              {/* ======================= MEGA MENU: SALE ======================= */}
              {item.name === "SALE" && (
                <div className={`absolute left-0 top-full mt-1 w-[320px] border transition-all duration-300 z-50 cursor-default opacity-0 invisible group-hover:opacity-100 group-hover:visible ${megaMenuClass}`}>
                  <div className="p-5 flex flex-col gap-6">

                    {/* Nhóm 1: Quần Áo */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Sale Quần Áo
                      </h4>
                      <ul className="space-y-3">
                        <li>
                          <Link href="/sale/ao-thun" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Sale Áo Thun
                          </Link>
                        </li>
                        <li>
                          <Link href="/sale/ao-so-mi" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Sale Áo Sơ Mi
                          </Link>
                        </li>
                        <li>
                          <Link href="/sale/ao-khoac" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Sale Áo Khoác
                          </Link>
                        </li>
                        <li>
                          <Link href="/sale/quan-dai" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Sale Quần Dài
                          </Link>
                        </li>
                        <li>
                          <Link href="/sale/quan-short" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Sale Quần Short
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Nhóm 2: Phụ kiện */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Sale Phụ Kiện
                      </h4>
                      <ul className="space-y-3">
                        <li>
                          <Link href="/sale/phu-kien" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Balo, Nón, Ví, Dây Nịt...
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Nhóm 3: Giá Đặc Biệt */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Giá Đặc Biệt
                      </h4>
                      <ul className="space-y-3">
                        <li>
                          <Link href="/sale/gia-dac-biet" className={`text-sm transition-colors duration-200 flex items-center gap-2 ${linkClass}`}>
                            <span className="text-[10px] opacity-40 font-mono">&gt;</span> Đồ Dùng Tiện Ích
                          </Link>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* ======================= MEGA MENU: ÁO ======================= */}
              {item.name === "ÁO" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[800px] border transition-all duration-300 z-50 cursor-default opacity-0 invisible group-hover:opacity-100 group-hover:visible ${megaMenuClass}`}>
                  <div className="p-4 grid grid-cols-4 gap-8">
                    {/* Cột 1: Áo Thun */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Thun
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/3" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Thun Tay Ngắn</Link></li>
                        <li><Link href="/category/13" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Thun Tay Dài</Link></li>
                        <li><Link href="/category/18" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Thun 3 Lỗ</Link></li>
                      </ul>
                    </div>

                    {/* Cột 2: Áo Polo */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Polo
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/14" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Polo Tay Ngắn</Link></li>
                        <li><Link href="/category/47" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Polo Tay Dài</Link></li>
                      </ul>
                    </div>

                    {/* Cột 3: Áo Sơ Mi */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Sơ Mi
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/15" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Tay Ngắn</Link></li>
                        <li><Link href="/category/26" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Tay Dài</Link></li>
                        <li><Link href="/category/25" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Khoác</Link></li>
                      </ul>
                    </div>

                    {/* Cột 4: Áo Khoác */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Khoác
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/5" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Jean</Link></li>
                        <li><Link href="/category/11" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Kaki</Link></li>
                        <li><Link href="/category/19" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Hoodie</Link></li>
                        <li><Link href="/category/21" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Parka</Link></li>
                        <li><Link href="/category/51" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Bomber</Link></li>
                        <li><Link href="/category/54" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Thể Thao</Link></li>
                        <li><Link href="/category/83" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Dù</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================= MEGA MENU: QUẦN ======================= */}
              {item.name === "QUẦN" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[800px] border transition-all duration-300 z-50 cursor-default opacity-0 invisible group-hover:opacity-100 group-hover:visible ${megaMenuClass}`}>
                  <div className="p-4 grid grid-cols-4 gap-8">
                    {/* Cột 1: Quần Dài */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Quần Dài
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/6" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Kaki</Link></li>
                        <li><Link href="/category/17" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Tây</Link></li>
                        <li><Link href="/category/20" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Jogger</Link></li>
                      </ul>
                    </div>

                    {/* Cột 2: Quần Jeans */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Quần Jeans
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/2" className={`text-sm transition-colors duration-200 ${linkClass}`}>Jeans Regular Fit</Link></li>
                        <li><Link href="/category/60" className={`text-sm transition-colors duration-200 ${linkClass}`}>Jeans Loose Fit</Link></li>
                        <li><Link href="/category/65" className={`text-sm transition-colors duration-200 ${linkClass}`}>Jeans Slim Fit</Link></li>
                        <li><Link href="/category/50" className={`text-sm transition-colors duration-200 ${linkClass}`}>Jeans Jogger</Link></li>
                      </ul>
                    </div>

                    {/* Cột 3: Quần Short */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Quần Short
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/16" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Kaki</Link></li>
                        <li><Link href="/category/30" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Jeans Short</Link></li>
                        <li><Link href="/category/33" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Dù</Link></li>
                        <li><Link href="/category/42" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Thun</Link></li>
                        <li><Link href="/category/46" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Cargo</Link></li>
                        <li><Link href="/category/53" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Active</Link></li>
                      </ul>
                    </div>

                    {/* Cột 4: Đồ Lót Nam */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Đồ Lót Nam
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/23" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Lót Lụa Băng</Link></li>
                        <li><Link href="/category/70" className={`text-sm transition-colors duration-200 ${linkClass}`}>Sợi Tự Nhiên</Link></li>
                        <li><Link href="/category/71" className={`text-sm transition-colors duration-200 ${linkClass}`}>Seamless</Link></li>
                        <li><Link href="/category/72" className={`text-sm transition-colors duration-200 ${linkClass}`}>Thể Thao</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================= MEGA MENU: PHỤ KIỆN ======================= */}
              {item.name === "PHỤ KIỆN" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[1000px] border transition-all duration-300 z-50 cursor-default opacity-0 invisible group-hover:opacity-100 group-hover:visible ${megaMenuClass}`}>
                  <div className="p-4 grid grid-cols-4 gap-x-8 gap-y-4">
                    {/* 1. NÓN */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Nón
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/4" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Dad Hat</Link></li>
                        <li><Link href="/category/36" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Baseball Cap</Link></li>
                        <li><Link href="/category/35" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Snap Back</Link></li>
                        <li><Link href="/category/37" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Bucket</Link></li>
                        <li><Link href="/category/34" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Fitted Cap</Link></li>
                      </ul>
                    </div>

                    {/* 2. TÚI XÁCH */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Túi Đeo Chéo & Túi Xách
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/12" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Đeo Chéo</Link></li>
                        <li><Link href="/category/41" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Bao Tử</Link></li>
                        <li><Link href="/category/10" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Tote</Link></li>
                        <li><Link href="/category/48" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Messenger</Link></li>
                      </ul>
                    </div>

                    {/* 3. BALO */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Balo
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/43" className={`text-sm transition-colors duration-200 ${linkClass}`}>Balo Essential</Link></li>
                        <li><Link href="/category/80" className={`text-sm transition-colors duration-200 ${linkClass}`}>Balo Camping</Link></li>
                        <li><Link href="/category/81" className={`text-sm transition-colors duration-200 ${linkClass}`}>Balo Campus</Link></li>
                        <li><Link href="/category/82" className={`text-sm transition-colors duration-200 ${linkClass}`}>Balo Smart</Link></li>
                      </ul>
                    </div>

                    {/* 4. VÍ */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Ví
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/7" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Cardholder</Link></li>
                        <li><Link href="/category/31" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Ngang Công Sở</Link></li>
                        <li><Link href="/category/40" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Canvas</Link></li>
                        <li><Link href="/category/61" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Cầm Tay</Link></li>
                      </ul>
                    </div>

                    {/* 5. DÂY NỊT */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Dây Nịt
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/8" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Dù</Link></li>
                        <li><Link href="/category/9" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Đan</Link></li>
                        <li><Link href="/category/22" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Da Bò Ý</Link></li>
                        <li><Link href="/category/45" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Da Bò</Link></li>
                      </ul>
                    </div>

                    {/* 6. VỚ */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Vớ
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/29" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Basic</Link></li>
                        <li><Link href="/category/27" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Công Thái Học</Link></li>
                        <li><Link href="/category/28" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Thời Trang</Link></li>
                        <li><Link href="/category/52" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Thể Thao</Link></li>
                      </ul>
                    </div>

                    {/* 7. PHỤ KIỆN THỂ THAO */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Phụ Kiện Thể Thao
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/64" className={`text-sm transition-colors duration-200 ${linkClass}`}>Băng Trán</Link></li>
                        <li><Link href="/category/66" className={`text-sm transition-colors duration-200 ${linkClass}`}>Băng Đeo Cổ Tay</Link></li>
                        <li><Link href="/category/75" className={`text-sm transition-colors duration-200 ${linkClass}`}>Bó Gối</Link></li>
                        <li><Link href="/category/74" className={`text-sm transition-colors duration-200 ${linkClass}`}>Khăn Thể Thao</Link></li>
                      </ul>
                    </div>

                    {/* 8. GIÀY DÉP */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Giày & Dép
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/32" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Đế Trấu</Link></li>
                        <li><Link href="/category/39" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Đế Thấp</Link></li>
                        <li><Link href="/category/44" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Siêu Nhẹ</Link></li>
                        <li><Link href="/category/38" className={`text-sm transition-colors duration-200 ${linkClass}`}>Giày Tây Loafer</Link></li>
                      </ul>
                    </div>

                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {/* 3. Phần Phải: Icons */}
        <div className="flex-1 flex items-center justify-end gap-5 md:gap-6">

          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hover:opacity-70 transition-opacity flex items-center"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 top-10 mt-2 w-[350px] md:w-[600px] bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white/90 shadow-2xl rounded-sm border border-gray-200 dark:border-[#333] overflow-hidden flex flex-col font-sans z-50">

                {/* Header: Thanh nhập liệu */}
                <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-[#333]">
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Tìm kiếm</span>
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-gray-900 dark:text-white text-base focus:ring-0 outline-none w-full placeholder-gray-400 dark:placeholder-gray-600"
                      placeholder="Tìm kiếm"
                    />
                  </div>
                  <button onClick={closeSearch} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition text-gray-500 dark:text-gray-400">
                    <X size={16} />
                  </button>
                  <Search size={18} className="ml-3 text-gray-500 dark:text-gray-400" />
                </div>

                {searchQuery.trim().length > 0 && (
                  <div className="flex flex-col md:flex-row p-6 min-h-[300px]">

                    {/* Cột 1: GỢI Ý (Danh mục) */}
                    <div className="w-full md:w-1/3 md:border-r border-gray-200 dark:border-[#333] md:pr-6 mb-6 md:mb-0">
                      <h4 className="text-[11px] text-gray-500 uppercase tracking-widest mb-5 font-semibold">Gợi ý</h4>
                      <ul className="space-y-4">
                        {searchResults.categories?.map((cat) => (
                          <li key={cat.id}>
                            <Link
                              href={`/collections/${cat.id}`}
                              onClick={closeSearch}
                              className="text-[15px] text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-gray-300 transition block"
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                        {(!searchResults.categories || searchResults.categories.length === 0) && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Không có gợi ý</p>
                        )}
                      </ul>
                    </div>

                    {/* Cột 2: SẢN PHẨM */}
                    <div className="w-full md:w-2/3 md:pl-6">
                      <h4 className="text-[11px] text-gray-500 uppercase tracking-widest mb-5 font-semibold">Sản phẩm</h4>
                      <div className="space-y-4">
                        {searchResults.products?.map((prod) => (
                          <Link
                            key={prod.id}
                            href={`/product/${prod.id}`}
                            onClick={closeSearch}
                            className="flex items-center gap-4 group"
                          >
                            <img
                              src={prod.imageUrl || "/image/default.jpg"}
                              alt={prod.name}
                              className="w-14 h-16 object-cover bg-gray-50 dark:bg-white rounded-sm border border-gray-100 dark:border-none"
                            />
                            <p className="text-[14px] text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-gray-300 transition line-clamp-2 leading-relaxed">
                              {prod.name}
                            </p>
                          </Link>
                        ))}
                        {(!searchResults.products || searchResults.products.length === 0) && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Không tìm thấy sản phẩm</p>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Footer: Nút xem tất cả */}
                {searchQuery.trim().length > 0 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={closeSearch}
                    className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition border-t border-gray-200 dark:border-[#333] cursor-pointer"
                  >
                    <span className="text-[14px] font-medium">Tìm kiếm "{searchQuery}"</span>
                    <ArrowRight size={16} className="text-gray-400" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* User */}
          {userName ? (
            <div className="relative user-menu">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <User size={20} strokeWidth={1.5} />
                <span className="text-[13px] font-medium hidden md:block">{userName}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-3 w-40 bg-white dark:bg-[#1a1814] text-gray-800 dark:text-white shadow-xl rounded-md overflow-hidden z-50 border border-gray-100 dark:border-gray-800">
                  <Link
                    href="/account"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      router.push("/");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition border-t border-gray-100 dark:border-gray-800 text-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
          )}

          {/* Cart */}
          <button
            onClick={() => router.push("/cart")}
            className="relative hover:opacity-70 transition-opacity"
          >
            <ShoppingCart size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
}