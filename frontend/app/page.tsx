"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import HeroBanner from "@/components/HeroBanner"
import CategoryBanner from "@/components/CategoryBanner";
import ProductBanner from "@/components/ProductBanner";
import Footer from "@/components/Footer";
import { getCart } from "@/services/cart-services";

export default function HomePage() {
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