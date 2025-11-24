"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import { getCart } from "@/services/cart-services";
import { logout } from "@/services/auth-services";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* 📌 Load giỏ hàng khi vào trang */
  useEffect(() => {
    async function fetchCart() {
      try {
        const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
        const totalLocal = localCart.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );

        const token = localStorage.getItem("token");
        if (token) {
          const serverCart = await getCart();
          const totalServer = serverCart.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          );

          setCartCount(totalServer > 0 ? totalServer : totalLocal);
        } else {
          setCartCount(totalLocal);
        }
      } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
      }
    }

    fetchCart();
  }, []);

  /* 📌 Nhận sự kiện thêm vào giỏ hàng từ ProductBanner */
  useEffect(() => {
    function updateCart(e: any) {
      const added = e.detail?.added || 0;
      setCartCount((prev) => prev + added);
    }

    window.addEventListener("cartChanged", updateCart);
    return () => window.removeEventListener("cartChanged", updateCart);
  }, []);

  /* 📌 Theo dõi user */
  useEffect(() => {
    function updateUser() {
      const userStr = localStorage.getItem("user");
      if (!userStr) return setUserName(null);

      try {
        const user = JSON.parse(userStr);
        setUserName(user.username);
      } catch {
        setUserName(null);
      }
    }

    window.addEventListener("userChanged", updateUser);
    updateUser();

    return () => window.removeEventListener("userChanged", updateUser);
  }, []);

  /* 📌 Scroll hiệu ứng */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* 📌 Đóng menu user khi click ngoài */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* 📌 Logout */
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 font-['Poppins'] transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg text-gray-800"
          : "bg-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/image/NovaLogo.png"
            alt="Logo"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-2xl font-semibold">
            <span className="font-bold">Nova</span> Store
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {/* SEARCH */}
          <button
            onClick={() => {
              const searchBox = document.getElementById("product-search");
              if (searchBox) {
                searchBox.scrollIntoView({ behavior: "smooth", block: "center" });
                searchBox.focus();
              }
            }}
            className="hover:opacity-80 transition"
          >
            <Search size={22} />
          </button>

          {/* ⭐ GIỎ HÀNG — ĐÃ SỬA TRỰC TIẾP ⭐ */}
          <button
            onClick={() => {
              const token = localStorage.getItem("token");
              if (!token) {
                router.push("/login");   // ⭐ Chuyển đến login nếu chưa đăng nhập
                return;
              }
              router.push("/cart"); // ⭐ Nếu đã đăng nhập → vào giỏ hàng
            }}
            className="relative hover:opacity-80 transition"
          >
            <ShoppingCart size={22} />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* USER */}
          {userName ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <User size={20} />
                <span className="text-sm font-medium">{userName}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white text-gray-700 rounded-lg shadow-lg py-2 animate-fade">
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    Thông tin tài khoản
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 hover:opacity-80 transition">
              <User size={20} />
              <span className="text-sm font-medium">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
