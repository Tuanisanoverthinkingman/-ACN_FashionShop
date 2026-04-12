"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getCart } from "@/services/cart-services";
import { logout } from "@/services/auth-services";

// --- Danh sách Menu ---
const NAV_MENU = [
  { name: "SALE", path: "/sale", hasDropdown: true },
  { name: "ÁO", path: "/category/ao", hasDropdown: true },
  { name: "QUẦN", path: "/category/quan", hasDropdown: true },
  { name: "PHỤ KIỆN", path: "/category/phu-kien", hasDropdown: true },
];

// --- Hook kiểm tra user ---
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

// --- Hook cart count ---
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

// COMPONENT CHÍNH: NAVBAR
export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const userName = useUser();
  const cartCount = useCartCount();
  const [showMenu, setShowMenu] = useState(false);

  // --- LOGIC MÀU NAVBAR (Dùng thuần Tailwind, không phụ thuộc cuộn) ---
  // Mặc định là Trắng, thêm dark:... để chuyển Đen khi ở chế độ Tối
  const navBgClass = "bg-white dark:bg-[#1a1814] text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 shadow-sm";

  // --- CẤU HÌNH MÀU MEGA MENU VÀ NỘI DUNG BÊN TRONG ---
  const megaMenuClass = "bg-white dark:bg-[#1a1814] border-t border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white shadow-xl";
  const titleClass = "text-gray-900 dark:text-white border-gray-200 dark:border-gray-700";
  const linkClass = "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium";

  // Scroll đến search section
  const handleSearchScroll = () => {
    const section = document.getElementById("search");
    if (section) {
      const y = section.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
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
                        <li><Link href="/category/10" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Thun Tay Dài</Link></li>
                        <li><Link href="/category/18" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Thun 3 Lỗ</Link></li>
                      </ul>
                    </div>

                    {/* Cột 2: Áo Polo */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Polo
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/11" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Polo Tay Ngắn</Link></li>
                      </ul>
                    </div>

                    {/* Cột 3: Áo Sơ Mi */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Sơ Mi
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/15" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Tay Ngắn</Link></li>
                        <li><Link href="/category/13" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Tay Dài</Link></li>
                        <li><Link href="/category/25" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Sơ Mi Khoác</Link></li>
                      </ul>
                    </div>

                    {/* Cột 4: Áo Khoác */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Áo Khoác
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/21" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Parka</Link></li>
                        <li><Link href="/category/1" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Jean</Link></li>
                        <li><Link href="/category/8" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Kaki</Link></li>
                        <li><Link href="/category/19" className={`text-sm transition-colors duration-200 ${linkClass}`}>Áo Khoác Hoodie</Link></li>
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
                        <li><Link href="/category/2" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Kaki</Link></li>
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
                        <li><Link href="/category/12" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Jeans Regular Fit</Link></li>
                      </ul>
                    </div>

                    {/* Cột 3: Quần Short */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Quần Short
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/16" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Kaki</Link></li>
                        <li><Link href="/category/29" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Jeans Short</Link></li>
                        <li><Link href="/category/32" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Dù</Link></li>
                        <li><Link href="/category/41" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Short Thun</Link></li>
                      </ul>
                    </div>

                    {/* Cột 4: Đồ Lót Nam */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Đồ Lót Nam
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/23" className={`text-sm transition-colors duration-200 ${linkClass}`}>Quần Lót Lụa Băng</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================= MEGA MENU: PHỤ KIỆN ======================= */}
              {item.name === "PHỤ KIỆN" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[1000px] border transition-all duration-300 z-50 cursor-default opacity-0 invisible group-hover:opacity-100 group-hover:visible ${megaMenuClass}`}>
                  <div className="p-4 grid grid-cols-4 gap-x-8 gap-y-4">
                    
                    {/* ====== HÀNG 1 ====== */}
                    {/* 1. NÓN */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Nón
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/14" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Dad Hat</Link></li>
                        <li><Link href="/category/35" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Baseball Cap</Link></li>
                        <li><Link href="/category/34" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Snap Back</Link></li>
                        <li><Link href="/category/36" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Bucket</Link></li>
                        <li><Link href="/category/33" className={`text-sm transition-colors duration-200 ${linkClass}`}>Nón Fitted Cap</Link></li>
                      </ul>
                    </div>

                    {/* 2. TÚI XÁCH */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Túi Đeo Chéo & Túi Xách
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/9" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Đeo Chéo (Cross Bag)</Link></li>
                        <li><Link href="/category/40" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Bao Tử (Hip Sack)</Link></li>
                        <li><Link href="/category/7" className={`text-sm transition-colors duration-200 ${linkClass}`}>Túi Tote</Link></li>
                      </ul>
                    </div>

                    {/* 3. BALO */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Balo
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/42" className={`text-sm transition-colors duration-200 ${linkClass}`}>Balo Essential</Link></li>
                      </ul>
                    </div>

                    {/* 4. VÍ */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Ví
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/30" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Ngang Công Sở</Link></li>
                        <li><Link href="/category/39" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Canvas</Link></li>
                        <li><Link href="/category/4" className={`text-sm transition-colors duration-200 ${linkClass}`}>Ví Cardholder</Link></li>
                      </ul>
                    </div>

                    {/* ====== HÀNG 2 ====== */}
                    {/* 5. DÂY NỊT */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Dây Nịt
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/22" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Da Bò Ý</Link></li>
                        <li><Link href="/category/6" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Đan</Link></li>
                        <li><Link href="/category/5" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dây Nịt Dù</Link></li>
                      </ul>
                    </div>

                    {/* 6. VỚ */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Vớ
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/28" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Basic</Link></li>
                        <li><Link href="/category/26" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Công Thái Học</Link></li>
                        <li><Link href="/category/27" className={`text-sm transition-colors duration-200 ${linkClass}`}>Vớ Thời Trang</Link></li>
                      </ul>
                    </div>

                    {/* 7. PHỤ KIỆN THỂ THAO */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Phụ Kiện Thể Thao
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="#" className={`text-sm transition-colors duration-200 ${linkClass}`}>Băng Trán</Link></li>
                        <li><Link href="#" className={`text-sm transition-colors duration-200 ${linkClass}`}>Băng Đeo Cổ Tay</Link></li>
                        <li><Link href="#" className={`text-sm transition-colors duration-200 ${linkClass}`}>Bó Gối</Link></li>
                      </ul>
                    </div>

                    {/* 8. DÉP */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Dép
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/31" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Đế Trấu</Link></li>
                        <li><Link href="/category/38" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Đế Thấp</Link></li>
                        <li><Link href="/category/43" className={`text-sm transition-colors duration-200 ${linkClass}`}>Dép Siêu Nhẹ</Link></li>
                      </ul>
                    </div>

                    {/* ====== HÀNG 3 ====== */}
                    {/* 9. GIÀY */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Giày
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/37" className={`text-sm transition-colors duration-200 ${linkClass}`}>Giày Tây Loafer</Link></li>
                      </ul>
                    </div>

                    {/* 10. PHỤ KIỆN CÁ NHÂN */}
                    <div>
                      <h4 className={`text-[13px] font-semibold mb-4 flex items-center gap-2 border-b pb-2 uppercase tracking-wider ${titleClass}`}>
                        Cá Nhân Khác
                      </h4>
                      <ul className="space-y-3">
                        <li><Link href="/category/24" className={`text-sm transition-colors duration-200 ${linkClass}`}>Khác</Link></li>
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
          {/* Search */}
          <button onClick={handleSearchScroll} className="hover:opacity-70 transition-opacity">
            <Search size={20} strokeWidth={1.5} />
          </button>

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