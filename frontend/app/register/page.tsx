"use client";

import { useState } from "react";
import { createUser } from "@/services/user-services";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }

    if (!form.fullName || !form.phone) {
      toast.error("Vui lòng điền đầy đủ họ tên và số điện thoại!");
      return;
    }

    try {
      setLoading(true);
      await createUser({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });

      toast.success("Đăng ký thành công 🎉");

      // redirect về HomePage và bật popup login
      router.push("/?login=true");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Đăng ký thất bại 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Poppins']">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Tạo tài khoản mới
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Tên người dùng"
            value={form.username}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />
          <input
            type="text"
            name="fullName"
            placeholder="Họ và tên"
            value={form.fullName}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Đã có tài khoản?{" "}
          <button
            onClick={() => router.push("/?login=true")}
            className="text-black font-medium hover:underline"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}