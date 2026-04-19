"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="text-center pt-[90px]">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusText, setStatusText] = useState("Đang kiểm tra giao dịch...");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Lấy status từ URL mà Backend đã Redirect về (ví dụ: ?status=00)
    const status = searchParams.get("status");

    if (status === "00") {
      setIsSuccess(true);
      setStatusText("Thanh toán thành công! Cảm ơn bạn đã mua hàng.");
      toast.success("Giao dịch thành công!");
    } else if (status) {
      setIsSuccess(false);
      setStatusText("Thanh toán thất bại hoặc giao dịch đã bị hủy.");
      toast.error("Giao dịch không thành công.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-[120px] px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {isSuccess === null ? (
          <div className="text-blue-500 text-xl font-semibold animate-pulse">
            ⏳ {statusText}
          </div>
        ) : isSuccess ? (
          <div>
            <div className="text-green-500 text-5xl mb-4">✔️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{statusText}</h1>
            <p className="text-gray-600 mb-6">Đơn hàng của bạn đang được chuẩn bị.</p>
          </div>
        ) : (
          <div>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{statusText}</h1>
            <p className="text-gray-600 mb-6">Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition"
        >
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
}