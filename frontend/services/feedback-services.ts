import api from "./api";
import { toast } from "react-toastify";

// 1. Cập nhật Interface để khớp với dữ liệu trả về từ API mới
export interface FeedbackData {
  id: number;          
  productId: number;    
  content: string;      
  rating: number;       
  userId: number;     
  userName?: string;    
  createdAt?: string;
  updatedAt?: string;
}

// Interface dùng cho Request gửi đi
export interface CreateFeedbackDto {
  productId: number;
  content: string;
  rating: number;
}

// Helper xử lý thông báo lỗi
const handleFeedbackError = (error: any, defaultMsg: string) => {
  const message = error.response?.data?.message || error.response?.data || defaultMsg;
  toast.error(message);
  throw error;
};

// 2. Lấy tất cả feedback (Admin thấy hết, User thấy của mình)
export const getAllFeedback = async (): Promise<FeedbackData[] | undefined> => {
  try {
    const res = await api.get("/api/Feedback");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Lấy danh sách đánh giá thất bại");
  }
};

// 3. Lấy feedback theo từng sản phẩm (Dành cho trang chi tiết sản phẩm)
export const getFeedbackByProduct = async (productId: number): Promise<FeedbackData[]> => {
  try {
    const res = await api.get(`/api/Feedback/product/${productId}`);
    return res.data;
  } catch (error: any) {
    // Không toast lỗi ở đây để tránh gây phiền khi sản phẩm chưa có feedback
    console.error("Lỗi lấy feedback sản phẩm:", error);
    return [];
  }
};

// 4. Tạo feedback mới (Chỉ cho sản phẩm IsDeleted = false)
export const createFeedback = async (data: CreateFeedbackDto) => {
  try {
    const res = await api.post("/api/Feedback", data);
    toast.success("Cảm ơn bạn đã để lại đánh giá! ⭐");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Gửi đánh giá thất bại");
  }
};

// 5. Cập nhật feedback (User hoặc Admin)
export const updateFeedback = async (id: number, data: CreateFeedbackDto) => {
  try {
    const res = await api.put(`/api/Feedback/${id}`, data);
    toast.success("Cập nhật đánh giá thành công");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Cập nhật đánh giá thất bại");
  }
};

// 6. Xoá feedback (User hoặc Admin)
export const deleteFeedback = async (id: number) => {
  try {
    const res = await api.delete(`/api/Feedback/${id}`);
    toast.success(res.data?.message || "Đã xóa đánh giá");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Xoá đánh giá thất bại");
  }
};