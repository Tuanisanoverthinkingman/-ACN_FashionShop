import api from "./api";
import { toast } from "react-toastify";

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
}

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const res = await api.get("/api/users/getAll");
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const res = await api.get(`/api/users/detail/${id}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await api.get("/api/users/me");
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (data: any): Promise<User> => {
  try {
    const endpoint = data.role === "Admin" ? "/api/users/Admin" : "/api/users/User";
    const res = await api.post(endpoint, data);
    toast.success("Tạo người dùng thành công");
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const updateMe = async (data: any): Promise<User> => {
  try {
    const res = await api.put("/api/users/update", data);
    toast.success(res.data.message || "Cập nhật thông tin thành công");
    return res.data;
  } catch (error) {
    throw error;
  }
};

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

export const updateUser = async (id: number, data: any): Promise<any> => {
  try {
    const res = await api.put(`/api/users/${id}`, data);
    return res.data;
  } catch (error) {
    throw error;
  }
};