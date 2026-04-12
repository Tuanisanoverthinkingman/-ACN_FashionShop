"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import { getCurrentUser, updateMe, updatePassword } from "@/services/user-services";
import { getMyOrders } from "@/services/order-services";
import { toast } from "react-hot-toast";

interface UserForm {
  fullName: string;
  phone: string;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"info" | "password" | "orders">("info");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Thông tin
  const [infoForm, setInfoForm] = useState<UserForm>({ fullName: "", phone: "" });

  // Form đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 5;

  // FETCH USER 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await getCurrentUser();
        setUser(me);
        setInfoForm({
          fullName: me.fullName || "",
          phone: me.phone || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Không thể lấy thông tin user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // FETCH ORDERS
  useEffect(() => {
    if (activeTab === "orders") {
      const fetchOrders = async () => {
        try {
          const data = await getMyOrders();
          setOrders(data || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  // HANDLE UPDATE INFO
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateMe(infoForm);
      toast.success("Cập nhật thành công!");
      setUser(res.user || infoForm);
    } catch (err: any) {
      toast.error(err.response?.data || "Có lỗi xảy ra");
    }
  };

  // HANDLE CHANGE PASSWORD
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    try {
      await updatePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data || "Có lỗi xảy ra");
    }
  };

  if (loading) return <p className="p-6 pt-[100px]">Loading...</p>;

  // Pagination cho Orders
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const currentOrders = orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 p-6 pt-[100px]">
        {/* Thông tin tài khoản */}
        {activeTab === "info" && (
          <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Thông tin tài khoản</h2>
            <form className="space-y-4" onSubmit={handleUpdateInfo}>
              <div>
                <label className="block text-sm font-medium">Tên đăng nhập</label>
                <input
                  disabled
                  value={user.username}
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Họ và tên</label>
                <input
                  value={infoForm.fullName}
                  onChange={(e) => setInfoForm({ ...infoForm, fullName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Số điện thoại</label>
                <input
                  value={infoForm.phone}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-80 transition">
                Cập nhật
              </button>
            </form>
          </div>
        )}

        {/* Đổi mật khẩu */}
        {activeTab === "password" && (
          <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Đổi mật khẩu</h2>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <div>
                <label className="block text-sm font-medium">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-80 transition">
                Đổi mật khẩu
              </button>
            </form>
          </div>
        )}

        {/* Đơn hàng */}
        {activeTab === "orders" && (
          <div className="bg-white p-6 rounded-lg shadow max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Đơn hàng của tôi</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500">Bạn chưa có đơn hàng nào 🥺</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border">Mã đơn</th>
                      <th className="px-4 py-2 border">Trạng thái</th>
                      <th className="px-4 py-2 border">Tổng tiền</th>
                      <th className="px-4 py-2 border">Ngày tạo</th>
                      <th className="px-4 py-2 border">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr key={order.orderId} className="text-center">
                        <td className="px-4 py-2 border">{order.orderId}</td>
                        <td className="px-4 py-2 border">{order.orderStatus}</td>
                        <td className="px-4 py-2 border">{order.totalAmount?.toLocaleString()}₫</td>
                        <td className="px-4 py-2 border">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border">
                          <a
                            href={`/order/${order.orderId}`}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:opacity-80 transition"
                          >
                            Xem
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
                    >
                      Trang trước
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`px-4 py-2 border rounded ${
                          currentPage === idx + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                        } transition`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100 transition"
                    >
                      Trang sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
