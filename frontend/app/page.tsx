"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import HeroBanner from "@/components/HeroBanner"
import CategoryBanner from "@/components/CategoryBanner";
import ProductBanner from "@/components/ProductBanner";
import Footer from "@/components/Footer";
import { getCart } from "@/services/cart-services";

export default function HomePage() {
  const [cartCount, setCartCount] = useState<number>(0);

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

  return (
    <>
      <NavBar/>
      <HeroBanner/>
      <CategoryBanner/>
      <ProductBanner/>
      <Footer/>
    </>
  );
}