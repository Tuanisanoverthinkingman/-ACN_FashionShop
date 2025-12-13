import api from "./api";
import { toast } from "react-toastify";

const handleError = (error: any) => {
  if (error.response?.data?.message) {
    toast.error(error.response.data.message);
  } else if (error.response?.data) {
    toast.error(JSON.stringify(error.response.data));
  } else {
    toast.error("Có lỗi xảy ra, thử lại sau");
  }
};


// Lấy tất cả user
export const getAllUsers = async () => {
  try {
    const res = await api.get("/api/users/getAll");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy user theo id
export const getUserById = async (id: number) => {
  try {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy user hiện tại (me)
export const getCurrentUser = async () => {
  try {
    const res = await api.get("/api/users/me");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo user bình thường
export const createUser = async (data: any) => {
  try {
    const res = await api.post("/api/users/User", data);
    toast.success("Tạo user thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật thông tin user hiện tại
export const updateMe = async (data: any) => {
  try {
    const res = await api.put("/api/users/update", data);
    toast.success(res.data.message || "Cập nhật thông tin thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Đổi mật khẩu
export const updatePassword = async (id: number, oldPassword: string, newPassword: string) => {
  try {
    const res = await api.put(`/api/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
    toast.success(res.data || "Đổi mật khẩu thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Xóa user
export const deleteUser = async (id: number) => {
  try {
    await api.delete(`/api/users/${id}`);
    toast.success("Xóa user thành công");
  } catch (error) {
    handleError(error);
  }
};
