import api from "./api";
import { toast } from "react-toastify";

// 1. Interface để quản lý dữ liệu Payment
export interface Payment {
  paymentId: number;
  orderId: number;
  promoId?: number;
  amount: number;
  address: string;
  paymentMethod: string; // "COD", "VNPay", v.v.
  status: string; // "Pending", "Completed", "Failed", "Cancelled"
  createdAt: string;
  vnpayUrl?: string; // URL trả về nếu dùng VNPay
}

const getPaymentError = (error: any, defaultMsg: string) => {
  return error.response?.data?.message || error.response?.data || defaultMsg;
};

// --- ADMIN APIs ---

export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const res = await api.get("/api/Payment/all");
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Lấy danh sách thanh toán thất bại"));
    throw error;
  }
};

export const updatePaymentStatus = async (id: number, newStatus: string) => {
  try {
    const res = await api.put(
      `/api/Payment/update-status/${id}`,
      `"${newStatus}"`, // Gửi string thuần qua JSON body
      { headers: { "Content-Type": "application/json" } }
    );
    toast.success(res.data.message || "Cập nhật trạng thái thành công");
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Cập nhật trạng thái thất bại"));
    throw error;
  }
};

// --- USER APIs ---

export const getMyPayments = async (): Promise<Payment[]> => {
  try {
    const res = await api.get("/api/Payment/user");
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Lấy lịch sử thanh toán thất bại"));
    throw error;
  }
};

export const createPayment = async (data: {
  orderId: number;
  promoId?: number;
  address: string;
  paymentMethod: string;
}) => {
  try {
    const res = await api.post("/api/Payment/create", data);
    toast.success(res.data.message || "Đã xác nhận phương thức thanh toán!");
    return res.data; // Thường trả về Payment object kèm vnpayUrl nếu có
  } catch (error: any) {
    toast.error(getPaymentError(error, "Xác nhận thanh toán thất bại"));
    throw error;
  }
};

export const createVnPayUrl = async (paymentId: number) => {
  try {
    const res = await api.post(`/api/Payment/create-vnpay/${paymentId}`);
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Không thể kết nối với cổng VNPay"));
    throw error;
  }
};

export const retryPayment = async (paymentId: number) => {
  try {
    const res = await api.post(`/api/Payment/retry/${paymentId}`);
    toast.success(res.data.message || "Đang thực hiện lại thanh toán");
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Thử lại thanh toán thất bại"));
    throw error;
  }
};

export const cancelPayment = async (paymentId: number) => {
  try {
    const res = await api.post(`/api/Payment/cancel/${paymentId}`);
    toast.success(res.data.message || "Đã hủy yêu cầu thanh toán");
    return res.data;
  } catch (error: any) {
    toast.error(getPaymentError(error, "Hủy thanh toán thất bại"));
    throw error;
  }
};

// Lấy payment theo OrderId
export const getPaymentByOrderId = async (orderId: number): Promise<Payment> => {
  try {
    const res = await api.get(`/api/Payment/order/${orderId}`);
    return res.data;
  } catch (error: any) {
    throw error;
  }
};