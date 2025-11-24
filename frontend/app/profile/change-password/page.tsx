"use client";

import { useState } from "react";
import { updatePassword } from "@/services/user-services";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const user = JSON.parse(localStorage.getItem("user")!); // user chứa id
      const res = await updatePassword(user.id, oldPassword, newPassword);

      setMessage("✅ Đổi mật khẩu thành công!");
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data || "Lỗi đổi mật khẩu"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 font-['Poppins']">
      <h1 className="text-2xl font-bold mb-4">Đổi mật khẩu</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded-lg">
        <div>
          <label className="block mb-1 font-medium">Mật khẩu cũ</label>
          <input 
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Mật khẩu mới</label>
          <input 
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Xác nhận mật khẩu</label>
          <input 
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes("❌") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
