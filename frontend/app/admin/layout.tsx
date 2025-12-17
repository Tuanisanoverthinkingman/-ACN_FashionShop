"use client";

import React, { useEffect } from "react";
import { Layout, Menu, Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { label } from "framer-motion/client";
import "antd/dist/reset.css";

const { Header, Content, Sider } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Kiểm tra đăng nhập + role admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      toast.error("Chưa đăng nhập!");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role.toLowerCase() !== "admin") {
      router.push("/");
      toast.error("Bạn không phải admin!");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userChanged"));
    router.push("/login");
    toast.success("Đăng xuất thành công!");
  };

  const menuItems = [
    { key: "1", label: <Link href="/admin">DashBoard</Link> },
    { key: "2", label: <Link href="/admin/users">Quản lý người dùng</Link> },
    { key: "3", label: <Link href="/admin/categories">Quản lý danh mục</Link> },
    { key: "4", label: <Link href="/admin/products">Quản lý sản phẩm</Link> },
    { key: "5", label: <Link href="/admin/promotions">Quản lý mã giảm giá</Link> },
    { key: "6", label: <Link href="/admin/feedbacks">Quản lý phản hồi</Link> },
    { key: "7", label: <Link href="/admin/orders">Quản lý đơn hàng</Link> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <div style={{ color: "white", padding: 16, textAlign: "center", fontSize: 20 }}>
          Admin Panel
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]} items={menuItems} />
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column" }}>
        <Header
          style={{
            height: 64,
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <div>Welcome Admin!</div>
          <Button type="primary" danger onClick={handleLogout}>
            Logout
          </Button>
        </Header>

        <Content
          style={{
            flex: 1,
            padding: 24,
            marginTop: 16,
            background: "#f0f2f5",
            borderRadius: 8,
            position: "relative",
          }}
        >
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            style={{ top: "80px" }}
          />
        </Content>
      </Layout>
    </Layout>
  );
}
