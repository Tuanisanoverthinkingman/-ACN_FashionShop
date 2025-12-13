"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import HeroBanner from "@/components/HeroBanner";
import CategoryBanner from "@/components/CategoryBanner";
import ProductBanner from "@/components/ProductBanner";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

export default function HomePage() {

  return (
    <>
      <div>
        <HeroBanner />
        <PromoBanner />
        <CategoryBanner />
        <ProductBanner />
      </div>
    </>
  );
}