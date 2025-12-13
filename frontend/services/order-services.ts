import api from "./api";
import { toast } from "react-toastify";

// Lấy tất cả đơn (Admin)
export const getAllOrders = async () => {
  try {
    const res = await api.get("/api/Order/getAll");
    toast.success(res.data.message || "Lấy đơn hàng thành công");
    return res.data.orders;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy đơn hàng thất bại");
    throw error;
  }
};

// Lấy đơn của user hiện tại
export const getMyOrders = async () => {
  try {
    const res = await api.get("/api/Order/user");
    toast.success(res.data.message || "Lấy đơn hàng thành công");
    return res.data.orders;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy đơn hàng thất bại");
    throw error;
  }
};

// Lấy đơn theo ID
export const getOrderById = async (id: number) => {
  try {
    const res = await api.get(`/api/Order/${id}`);
    toast.success(res.data.message || "Lấy đơn hàng thành công");
    return res.data.order;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy đơn hàng thất bại");
    throw error;
  }
};

// Tạo đơn từ cartItemIds
export const createOrder = async (cartItemIds: number[]) => {
  try {
    const res = await api.post("/api/Order", cartItemIds);
    toast.success(res.data.message || "Tạo đơn hàng thành công");
    return res.data.order;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Tạo đơn hàng thất bại");
    throw error;
  }
};

// Xoá đơn (Admin)
export const deleteOrder = async (id: number) => {
  try {
    const res = await api.delete(`/api/Order/${id}`);
    toast.success(res.data.message || "Xoá đơn hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xoá đơn hàng thất bại");
    throw error;
  }
};
