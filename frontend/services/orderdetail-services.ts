import api from "./api";
import { toast } from "react-toastify";

// Lấy chi tiết đơn hàng cho Admin
export const getOrderDetailsForAdmin = async (orderId: number) => {
  try {
    const res = await api.get(`/api/orderdetails/order/${orderId}`);
    toast.success("Lấy chi tiết đơn hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy chi tiết đơn hàng thất bại");
    throw error;
  }
};

// Lấy chi tiết đơn hàng cho User (chỉ được xem đơn của mình)
export const getOrderDetailsForUser = async (orderId: number) => {
  try {
    const res = await api.get(`/api/orderdetails/user/${orderId}`);
    toast.success("Lấy chi tiết đơn hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Lấy chi tiết đơn hàng thất bại");
    throw error;
  }
};
