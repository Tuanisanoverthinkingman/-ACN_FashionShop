"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/services/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      toast.error("Link xác thực không hợp lệ!");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.post("/api/EmailAndOTP/verify-email", { token, email });
        toast.success("Xác thực email thành công 🎉");
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Xác thực thất bại 😢");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 font-['Poppins']">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        {loading ? (
          <p>Đang xác thực email...</p>
        ) : (
          <p>Bạn có thể đóng trang này hoặc quay lại <span className="text-blue-500 cursor-pointer" onClick={() => router.push("/login")}>Login</span></p>
        )}
      </div>
    </div>
  );
}
