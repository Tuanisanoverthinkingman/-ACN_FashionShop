import api from "./api";
import { toast } from "react-toastify";

// Helper lấy message lỗi
const getOrderError = (error: any, defaultMsg: string) => {
  return error.response?.data?.message || error.response?.data || defaultMsg;
};

// 1. Lấy tất cả đơn (Admin)
export const getAllOrders = async () => {
  try {
    const res = await api.get("/api/Order/getAll");
    // Bỏ toast.success ở đây để tránh spam giao diện
    return res.data.orders;
  } catch (error: any) {
    toast.error(getOrderError(error, "Không thể tải danh sách đơn hàng"));
    throw error;
  }
};

// 2. Lấy đơn của user hiện tại (Client)
export const getMyOrders = async () => {
  try {
    const res = await api.get("/api/Order/user");
    return res.data.orders;
  } catch (error: any) {
    toast.error(getOrderError(error, "Không thể tải đơn hàng của bạn"));
    throw error;
  }
};

// 3. Lấy chi tiết đơn theo ID
export const getOrderById = async (id: number) => {
  try {
    const res = await api.get(`/api/Order/${id}`);
    return res.data.order;
  } catch (error: any) {
    toast.error(getOrderError(error, "Không tìm thấy chi tiết đơn hàng"));
    throw error;
  }
};

// 4. Tạo đơn từ danh sách trong giỏ hàng (Cart)
export const createOrder = async (cartItemIds: number[]) => {
  try {
    const res = await api.post("/api/Order", cartItemIds);
    toast.success("Đặt hàng thành công! Vui lòng chờ xác nhận. 📦");
    return res.data.order;
  } catch (error: any) {
    toast.error(getOrderError(error, "Đặt hàng thất bại"));
    throw error;
  }
};

// 5. Mua ngay một sản phẩm (Dùng ProductVariantId)
export const orderByProduct = async (
  productVariantId: number, 
  quantity: number
) => {
  try {
    const res = await api.post("/api/Order/order-by-product", {
      productVariantId, // Đã khớp với Backend
      quantity
    });
    toast.success("Thanh toán sản phẩm thành công! 🎉");
    return res.data.order;
  } catch (error: any) {
    toast.error(getOrderError(error, "Thanh toán thất bại"));
    throw error;
  }
};

// 6. Xoá đơn (Admin)
export const deleteOrder = async (id: number) => {
  try {
    const res = await api.delete(`/api/Order/${id}`);
    toast.success(res.data.message || "Đã xoá đơn hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(getOrderError(error, "Không thể xoá đơn hàng này"));
    throw error;
  }
};