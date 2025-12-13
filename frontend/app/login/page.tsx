"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth-services";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) return toast.error("Vui lòng nhập tài khoản!");
    if (!password.trim()) return toast.error("Vui lòng nhập mật khẩu!");

    setLoading(true);

    try {
      const { token, user } = await login(username, password);
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 font-['Poppins']">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Đăng nhập
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Tài khoản</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <div className="relative">
            <label className="block mb-1 font-medium text-gray-700">Mật khẩu</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/app/forgot-password")}
              className="ml-4 text-blue-500 hover:underline font-medium transition"
            >
              Quên mật khẩu?
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/app/send-verify-email")}
            className="text-sm text-blue-500 hover:underline transition font-medium"
          >
            Gửi lại email xác thực
          </button>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Chưa có tài khoản?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}
