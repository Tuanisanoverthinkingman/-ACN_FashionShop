"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Search, User } from "lucide-react";
import { getCart } from "@/services/cart-services";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const [cartCount, setCartCount] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  
    useEffect(() => {
      const fetchCart = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            // Nếu chưa đăng nhập thì không gọi API
            setCartCount(0);
            return;
          }
  
          const cartData = await getCart();
          // Nếu API trả về danh sách sản phẩm trong giỏ hàng
          const totalItems = cartData.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          );
          setCartCount(totalItems);
        } catch (err) {
          console.error("Lỗi khi tải giỏ hàng:", err);
          setCartCount(0);
        }
      };
  
      fetchCart();
    }, []);

  // 👇 Theo dõi cuộn để đổi màu nền navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        {/* 🌟 Logo + tên thương hiệu */}
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
          <button className="hover:opacity-80 transition">
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
            <div className="flex items-center gap-2">
              <User size={20} />
              <span className="text-sm font-medium">{userName}</span>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <User size={20} />
              <span className="text-sm font-medium">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
