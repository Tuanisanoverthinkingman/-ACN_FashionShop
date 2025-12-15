"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { sendVerificationEmail } from "@/services/emailAndOTPServices";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    if (!isValidEmail(email.trim())) {
      toast.error("Email không đúng định dạng!");
      return;
    }

    setLoading(true);
    try {
      await sendVerificationEmail(email.trim());
      toast.success("Email xác thực đã được gửi 📧");
      router.push("/login");
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error("Email chưa đăng ký, chuyển sang đăng ký");
        router.push("/register");
      } else {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 font-['Poppins']">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Gửi lại email xác thực
        </h2>

        <form onSubmit={handleSubmit} noValidate  className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Email đăng ký
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi email xác thực"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-blue-500 hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}