"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailToken } from "@/services/emailAndOTPServices";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ ❌");
      return;
    }

    // gọi API xác thực token
    verifyEmailToken(email, token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Xác thực tài khoản thành công 🎉");

        // tự động chuyển hướng sau 3 giây
        setTimeout(() => router.push("/login"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data || "Xác thực thất bại ❌");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 font-['Poppins']">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        {status === "loading" && <p>Đang xác thực email... ⏳</p>}
        {(status === "success" || status === "error") && (
          <>
            <p className={`font-semibold ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 text-blue-500 hover:underline"
            >
              Quay lại đăng nhập
            </button>
          </>
        )}
      </div>
    </div>
  );
}
