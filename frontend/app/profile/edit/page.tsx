"use client";

import { useEffect, useState } from "react";
import { getMe, updateUser } from "@/services/user-services";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/navigation";

export default function EditAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const fetchUser = async () => {
    try {
      const data = await getMe();

      setUserId(data.id);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
    } catch (err) {
      console.error("Lỗi lấy user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleUpdate = async () => {
    if (!userId) return alert("Không tìm thấy user!");

    const updateData = {
      fullName,
      email,
      phone,
    };

    try {
      await updateUser(userId, updateData);
      alert("Cập nhật thành công!");
      router.push("/profile");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Cập nhật thất bại!");
    }
  };

  return (
    <>
      <NavBar />

      <section className="max-w-4xl mx-auto px-4 py-32">
        <h2 className="text-3xl font-bold mb-8">Chỉnh sửa thông tin</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="bg-white shadow p-6 rounded-lg max-w-xl">

            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-1 font-medium">Họ và tên</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Số điện thoại</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-end">
              <button
                className="px-5 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                onClick={() => router.push("/account")}
              >
                Quay lại
              </button><button
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleUpdate}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}