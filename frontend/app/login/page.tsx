"use client";

import { useState } from "react";
import { login } from "@/services/auth-services";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.name, form.password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-white/40">

        <div className="flex items-center justify-center mb-8 gap-3">
          <img
            src="/image/NovaLogo.png"
            alt="Logo"
            className="h-12 w-12 rounded-full object-cover shadow-md"
          />
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
            <span className="font-bold">Nova</span> Store
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Username</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all shadow-sm"
              name="name"
              placeholder="Nhập username..."
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-gray-700">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all shadow-sm"
              name="password"
              placeholder="Nhập password..."
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl shadow-lg hover:opacity-90 transition text-lg font-semibold"
          >
            {loading ? "Logging in..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Chưa có tài khoản? 
          <a href="/register" className="text-blue-600 font-medium cursor-pointer hover:underline">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  );
}