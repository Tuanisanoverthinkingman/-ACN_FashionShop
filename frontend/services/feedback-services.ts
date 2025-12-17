import api from "./api";
import { toast } from "react-toastify";

/**
 * Type Feedback trả về từ Backend
 * (GET /api/Feedback/product/{productId})
 */
export interface FeedbackData {
  id?: number;          // id feedback
  productId: number;    // id sản phẩm
  content: string;      // nội dung đánh giá
  rating: number;       // số sao (1 - 5)
  userId?: number;      // id user (backend tự gán)
  userName?: string;    // 👈 tên người đánh giá (backend trả về)
}

/**
 * Lấy tất cả feedback
 * - Admin: thấy tất cả
 * - User: chỉ thấy feedback của mình
 */
export const getAllFeedback = async () => {
  try {
    const res = await api.get("/api/Feedback");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy feedback thất bại");
    throw error;
  }
};

/**
 * Lấy feedback theo productId
 * Dùng cho trang chi tiết sản phẩm
 */
export const getFeedbackByProduct = async (productId: number) => {
  try {
    const res = await api.get(`/api/Feedback/product/${productId}`);
    return res.data as FeedbackData[];
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy feedback thất bại");
    throw error;
  }
};

/**
 * Tạo feedback mới
 * userId lấy từ JWT (không gửi từ frontend)
 */
export const createFeedback = async (data: {
  productId: number;
  content: string;
  rating: number;
}) => {
  try {
    const res = await api.post("/api/Feedback", data);
    toast.success("Tạo feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Tạo feedback thất bại");
    throw error;
  }
};

/**
 * Cập nhật feedback
 * - User: chỉ sửa feedback của mình
 * - Admin: sửa tất cả
 */
export const updateFeedback = async (
  id: number,
  data: {
    productId: number;
    content: string;
    rating: number;
  }
) => {
  try {
    const res = await api.put(`/api/Feedback/${id}`, data);
    toast.success("Cập nhật feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Cập nhật feedback thất bại");
    throw error;
  }
};

/**
 * Xoá feedback
 * - User: chỉ xoá feedback của mình
 * - Admin: xoá tất cả
 */
export const deleteFeedback = async (id: number) => {
  try {
    const res = await api.delete(`/api/Feedback/${id}`);
    toast.success(res.data?.message || "Xoá feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xoá feedback thất bại");
    throw error;
  }
};