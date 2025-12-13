import api from "./api";
import { toast } from "react-toastify";

// Dữ liệu gửi khi tạo/cập nhật category
export type CategoryData = {
  name: string;
  description?: string;
};

// Kiểu Category đầy đủ trả về từ API
export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string; // thêm trường imageUrl cho Banner
}

// Lấy toàn bộ danh mục
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const res = await api.get("/api/categories");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy danh mục thất bại");
    throw error;
  }
};

// Lấy danh mục theo id
export const getCategoryById = async (id: number): Promise<Category> => {
  try {
    const res = await api.get(`/api/categories/${id}`);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy danh mục thất bại");
    throw error;
  }
};

// Tạo mới danh mục
export const createCategory = async (data: CategoryData) => {
  try {
    const res = await api.post("/api/categories", data);
    toast.success("Tạo danh mục thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Tạo danh mục thất bại");
    throw error;
  }
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: CategoryData) => {
  try {
    const res = await api.put(`/api/categories/${id}`, data);
    toast.success(res.data.message || "Cập nhật danh mục thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Cập nhật thất bại");
    throw error;
  }
};

// Xóa danh mục
export const deleteCategory = async (id: number) => {
  try {
    const res = await api.delete(`/api/categories/${id}`);
    toast.success(res.data.message || "Xóa danh mục thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xóa thất bại");
    throw error;
  }
};
