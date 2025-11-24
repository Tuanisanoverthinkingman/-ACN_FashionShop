"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/services/user-services";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchMe() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await getMe();
        setUser(res);
      } catch (err) {
        console.error("Lỗi load thông tin user:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  if (loading) return <p className="p-6 text-center">Đang tải...</p>;

  if (!user)
    return (
      <p className="p-6 text-center text-red-500">
        Không tìm thấy thông tin tài khoản
      </p>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 font-['Poppins']">
      <h1 className="text-3xl font-bold mb-6">Thông tin tài khoản</h1>

      <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Họ và tên:</strong> {user.fullName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Số điện thoại:</strong> {user.phone}</p>
        <p><strong>Vai trò:</strong> {user.role}</p>
        <p>
          <strong>Ngày tạo:</strong>{" "}
          {new Date(user.createAt).toLocaleString("vi-VN")}
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => router.push("/profile/edit")}
            className="bg-black text-white px-3 py-1.5 text-sm rounded hover:bg-gray-800 transition"
          >
            Chỉnh sửa thông tin
          </button>

          <button
            onClick={() => router.push("/profile/change-password")}
            className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 transition"
          >
            Đổi mật khẩu
          </button>

          <button
            onClick={() => router.push("/order")}
            className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700 transition"
          >
            Đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
