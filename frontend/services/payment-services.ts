import api from "./api";
import { toast } from "react-toastify";

// ===============================
// ADMIN – All payments
// GET /api/Payment/all
// ===============================
export const getAllPayments = async () => {
  try {
    const res = await api.get("/api/Payment/all");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy payments thất bại");
    throw error;
  }
};

// ===============================
// USER – My payments
// ===============================
export const getMyPayments = async () => {
  try {
    const res = await api.get("/api/Payment/user");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy payments thất bại");
    throw error;
  }
};

// ===============================
// Get payment by ID
// ===============================
export const getPaymentById = async (id: number) => {
  try {
    const res = await api.get(`/api/Payment/${id}`);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy payment thất bại");
    throw error;
  }
};

// ===============================
// Get latest payment by OrderId
// ===============================
export const getPaymentByOrderId = async (orderId: number) => {
  try {
    const res = await api.get(`/api/Payment/order/${orderId}`);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy payment thất bại");
    throw error;
  }
};

// ===============================
// Create payment
// ===============================
export const createPayment = async (data: {
  orderId: number;
  promoId?: number;
  address: string;
  paymentMethod: string;
}) => {
  try {
    const res = await api.post("/api/Payment/create", data);
    toast.success(res.data.message || "Tạo payment thành công!");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Tạo payment thất bại");
    throw error;
  }
};

// ===============================
// Retry payment
// ===============================
export const retryPayment = async (paymentId: number) => {
  try {
    const res = await api.post(`/api/Payment/retry/${paymentId}`);
    toast.success(res.data.message);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Retry payment thất bại");
    throw error;
  }
};

// ===============================
// Cancel payment
// ===============================
export const cancelPayment = async (paymentId: number) => {
  try {
    const res = await api.post(`/api/Payment/cancel/${paymentId}`);
    toast.success(res.data.message);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Hủy payment thất bại");
    throw error;
  }
};

// ===============================
// ADMIN – Update payment status
// ===============================
export const updatePaymentStatus = async (
  id: number,
  newStatus: string
) => {
  try {
    const res = await api.put(
      `/api/Payment/update-status/${id}`,
      `"${newStatus}"`,
      { headers: { "Content-Type": "application/json" } }
    );
    toast.success(res.data.message);
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
    throw error;
  }
};
