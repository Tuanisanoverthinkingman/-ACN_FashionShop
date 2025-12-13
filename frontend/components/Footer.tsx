"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useEffect, useState } from "react";

// Component chỉ render năm trên client
function FooterYear() {
  const [year, setYear] = useState<number>(0);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span>{year}</span>;
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 font-['Times_New_Roman']">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Categories */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-5">Categories</h4>
          <ul className="space-y-3">
            {["Women", "Men", "Shoes", "Watches"].map((item) => (
              <li key={item}>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-5">Help</h4>
          <ul className="space-y-3">
            {["Track Order", "Returns", "Shipping", "FAQs"].map((item) => (
              <li key={item}>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Get in touch */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-5">Get in Touch</h4>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            Any questions? Let us know in store at Bac Tu Liem, Ha Noi
          </p>
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-white transition-colors duration-300"><Facebook size={20} /></Link>
            <Link href="#" className="hover:text-white transition-colors duration-300"><Instagram size={20} /></Link>
            <Link href="#" className="hover:text-white transition-colors duration-300"><Twitter size={20} /></Link>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white text-lg font-semibold mb-5">Newsletter</h4>
          <form className="flex flex-col space-y-3">
            <input
              type="email"
              placeholder="email@example.com"
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              type="submit"
              className="bg-white text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-200 transition-all duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 mt-10 pt-8 text-center text-sm text-gray-500">
        <p>
          Copyright © <FooterYear /> All rights reserved | Made with{" "}
          <span className="text-red-500">♥</span> by ...
        </p>
      </div>
    </footer>
  );
}
