"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import HeroBanner from "@/components/HeroBanner";
import CategoryBanner from "@/components/CategoryBanner";
import ProductBanner from "@/components/ProductBanner";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const searchParams = useSearchParams();

  // Mở modal khi nhận event từ RegisterPage hoặc Navbar
  useEffect(() => {
    const handleOpenLogin = () => setShowLogin(true);
    window.addEventListener("openLoginModal", handleOpenLogin);
    return () => window.removeEventListener("openLoginModal", handleOpenLogin);
  }, []);

  // Mở modal nếu có query ?login=true
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setShowLogin(true);
    }
  }, [searchParams]);

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <div className={showLogin ? "filter blur-sm pointer-events-none" : ""}>
        <NavBar onLoginClick={() => setShowLogin(true)} />
        <HeroBanner />
        <CategoryBanner />
        <ProductBanner />
        <Footer />
      </div>
    </>
  );
}