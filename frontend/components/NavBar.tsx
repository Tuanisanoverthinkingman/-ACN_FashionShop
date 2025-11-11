"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import { getCart } from "@/services/cart-services";
import { useRouter } from "next/navigation";
import {logout} from "@/services/auth-services"

interface NavBarProps {
  onLoginClick?: () => void;
}

export default function NavBar({onLoginClick}: NavBarProps) {
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();
  
  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem("user");
      if (user) setUserName(JSON.parse(user).username);
      else setUserName(null);
    };

    // Check khi mount
    checkUser();

    // Lắng nghe sự kiện userChanged
    window.addEventListener("userChanged", checkUser);

    return () => {
      window.removeEventListener("userChanged", checkUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowMenu(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);
  
  // Theo dõi cuộn để đổi màu nền navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setCartCount(0);
          return;
        }
        const cartData = await getCart();
        const totalItems = cartData.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
        setCartCount(totalItems);
      } catch (err) {
        console.error(err);
        setCartCount(0);
      }
    };

    // Cập nhật khi mount
    updateCartCount();

    // Lắng nghe event cartChanged
    window.addEventListener("cartChanged", updateCartCount);

    return () => window.removeEventListener("cartChanged", updateCartCount);
  }, []);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/cart");
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 font-['Poppins'] transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-gray-800"
          : "bg-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        {/* Logo + tên thương hiệu */}
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

        {/* 🔍 Icons */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const section = document.getElementById("search");
              if (section) {
                section.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="hover:opacity-80 transition">
            <Search size={22} />
          </button>

          <button
            onClick={handleCartClick}
            className="relative hover:opacity-80 transition"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {userName ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <User size={20} />
                <span className="text-sm font-medium">{userName}</span>
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 mt-2 w-40 bg-white text-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
                  <Link
                    href="/app/account"
                    className="block px-4 py-2 hover:bg-gray-100 transition"
                    onClick={() => setShowMenu(false)}
                  >
                    Tài khoản
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      router.push("/")
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <User size={20} />
              <span className="text-sm font-medium">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
