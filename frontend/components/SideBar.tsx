"use client";

import React from "react";
import { FaUser, FaLock, FaShoppingBag } from "react-icons/fa";

type Tab = "info" | "password" | "orders";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function SideBar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "info", label: "Thông tin tài khoản", icon: <FaUser /> },
    { id: "password", label: "Đổi mật khẩu", icon: <FaLock /> },
    { id: "orders", label: "Đơn hàng của tôi", icon: <FaShoppingBag /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg p-6 flex flex-col gap-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Quản lý tài khoản</h2>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as Tab)}
          className={`flex items-center gap-3 px-4 py-2 rounded text-gray-700 font-medium transition-all duration-200 hover:bg-blue-100 ${
            activeTab === item.id ? "bg-blue-500 text-white" : ""
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}
