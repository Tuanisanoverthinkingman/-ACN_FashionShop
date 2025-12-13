import api from "./api";
import { toast } from "react-toastify";

// Type cho Feedback
export interface FeedbackData {
  id?: number; // update hoặc delete mới có
  productId: number;
  content: string;
  rating: number;
  userId?: number; // backend sẽ tự gán
}

// Lấy tất cả feedback (user hoặc admin)
export const getAllFeedback = async () => {
  try {
    const res = await api.get("/api/Feedback");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy feedback thất bại");
    throw error;
  }
};

// Lấy feedback theo product
export const getFeedbackByProduct = async (productId: number) => {
  try {
    const res = await api.get(`/api/Feedback/product/${productId}`);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy feedback thất bại");
    throw error;
  }
};

// Tạo feedback
export const createFeedback = async (data: FeedbackData) => {
  try {
    const res = await api.post("/api/Feedback", data);
    toast.success("Tạo feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Tạo feedback thất bại");
    throw error;
  }
};

// Cập nhật feedback
export const updateFeedback = async (id: number, data: FeedbackData) => {
  try {
    const res = await api.put(`/api/Feedback/${id}`, data);
    toast.success("Cập nhật feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Cập nhật feedback thất bại");
    throw error;
  }
};

// Xoá feedback
export const deleteFeedback = async (id: number) => {
  try {
    const res = await api.delete(`/api/Feedback/${id}`);
    toast.success(res.data.message || "Xoá feedback thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xoá feedback thất bại");
    throw error;
  }
};
