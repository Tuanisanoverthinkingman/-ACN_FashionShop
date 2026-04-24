import api from "./api";
import { toast } from "react-toastify";

// 1. Cập nhật Interface khớp với DB mới (Thêm Status và AdminReply)
export interface FeedbackData {
  id?: number;          
  productId?: number;    
  content: string;      
  rating: number;       
  userId?: number;     
  userName?: string;    
  
  // --- CÁC TRƯỜNG MỚI CHO ADMIN ---
  status?: number;       
  adminReply?: string;   
  replyAt?: string;      
  // --------------------------------
  
  createdAt?: string;
  updatedAt?: string;
}

// Interface dùng cho Request tạo mới (Bắt buộc đủ trường)
export interface CreateFeedbackDto {
  productId: number;
  content: string;
  rating: number;
}

// Interface dùng cho Request cập nhật (Các trường đều là tùy chọn - Optional)
export interface UpdateFeedbackDto {
  content?: string;
  rating?: number;
  status?: number;
  adminReply?: string;
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

// 4. Tạo feedback mới
export const createFeedback = async (data: CreateFeedbackDto) => {
  try {
    const res = await api.post("/api/Feedback", data);
    toast.success("Cảm ơn bạn đã để lại đánh giá! ⭐");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Gửi đánh giá thất bại");
  }
};

// 5. Cập nhật feedback (Đã đổi sang UpdateFeedbackDto để linh hoạt ẩn/hiện/trả lời)
export const updateFeedback = async (id: number, data: UpdateFeedbackDto) => {
  try {
    const res = await api.put(`/api/Feedback/${id}`, data);
    // Tạm bỏ toast success ở đây vì trang Admin đã có tự toast riêng cho từng hành động
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Cập nhật đánh giá thất bại");
  }
};

// 6. Xoá feedback cứng (Chỉ dùng khi cực kỳ cần thiết)
export const deleteFeedback = async (id: number) => {
  try {
    const res = await api.delete(`/api/Feedback/${id}`);
    toast.success(res.data?.message || "Đã xóa đánh giá vĩnh viễn");
    return res.data;
  } catch (error: any) {
    return handleFeedbackError(error, "Xoá đánh giá thất bại");
  }
};