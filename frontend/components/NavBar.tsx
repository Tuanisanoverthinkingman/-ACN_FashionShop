"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getCart } from "@/services/cart-services";
import { logout } from "@/services/auth-services";

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

// --- Hook scroll navbar ---
const useScrollNav = (pathname: string) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return isScrolled;
};

// --- Component NavBar ---
export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const userName = useUser();
  const cartCount = useCartCount();
  const isScrolled = useScrollNav(pathname);
  const [showMenu, setShowMenu] = useState(false);

  // Đổi màu navbar
  const navBgClass = pathname === "/"
    ? isScrolled
      ? "bg-white/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-gray-800"
      : "bg-transparent text-white"
    : "bg-white text-gray-800";

  // Scroll đến search section
  const handleSearchScroll = () => {
    const section = document.getElementById("search");
    if (section) {
      const y = section.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Click ngoài menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".user-menu")) setShowMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 font-['Poppins'] transition-all duration-500 ${navBgClass}`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/image/NovaLogo.png"
            alt="Logo"
            className="h-10 w-10 rounded-full object-cover shadow-sm"
          />
          <span className="text-2xl font-semibold tracking-wide">
            <span className="font-bold">Nova</span> Store
          </span>
        </Link>

        {/* Icons */}
        <div className="flex items-center gap-6">
          {/* Search */}
          <button onClick={handleSearchScroll} className="hover-opacity">
            <Search size={22} />
          </button>

          {/* Cart */}
          <button
            onClick={() => router.push("/cart")}
            className="relative hover-opacity"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* User */}
          {userName ? (
            <div className="relative user-menu">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover-opacity"
              >
                <User size={20} />
                <span className="text-sm font-medium">{userName}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
                  <Link
                    href="/account"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      router.push("/");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 hover-opacity"
            >
              <User size={20} />
              <span className="text-sm font-medium">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tailwind hover-opacity class */}
      <style jsx>{`
        .hover-opacity {
          transition: all 0.3s;
        }
        .hover-opacity:hover {
          opacity: 0.8;
        }
      `}</style>
    </nav>
  );
}
