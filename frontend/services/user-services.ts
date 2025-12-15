import api from "./api";
import { toast } from "react-toastify";

// Khai báo interface User
export interface User {
  id: number;
  fullName: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

// Lấy tất cả user
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const res = await api.get("/api/users/getAll");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Lấy user theo id
export const getUserById = async (id: number): Promise<User> => {
  try {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Lấy user hiện tại (me)
export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await api.get("/api/users/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Tạo user bình thường
export const createUser = async (data: any): Promise<User> => {
  try {
    const res = await api.post("/api/users/User", data);
    toast.success("Tạo user thành công");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật thông tin user hiện tại
export const updateMe = async (data: any): Promise<User> => {
  try {
    const res = await api.put("/api/users/update", data);
    toast.success(res.data.message || "Cập nhật thông tin thành công");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Đổi mật khẩu
export const updatePassword = async (id: number, oldPassword: string, newPassword: string): Promise<any> => {
  try {
    const res = await api.put(`/api/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
    toast.success(res.data || "Đổi mật khẩu thành công");
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Xóa user
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/users/${id}`);
    toast.success("Xóa user thành công");
  } catch (error) {
    throw error;
  }
};

export const updateIsActive = async (id: number): Promise<any> => {
  try {
    const res = await api.put(`/api/users/${id}/toggle-active`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
