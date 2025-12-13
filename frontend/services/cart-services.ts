import api from "./api";
import { toast } from "react-toastify";

// Lấy giỏ hàng của user
export const getCart = async () => {
  try {
    const res = await api.get("/api/CartItems/get");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data || "Lấy giỏ hàng thất bại");
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (data: { productId: number; quantity: number }) => {
  try {
    const res = await api.post("/api/CartItems/add", data);
    toast.success(res.data.message || "Thêm vào giỏ hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data || "Có lỗi xảy ra");
    throw error;
  }
};

// CẬP NHẬT SỐ LƯỢNG
export const updateCartQuantity = async (data: {
  cartItemId: number;
  quantity: number;
}) => {
  try {
    const res = await api.put("/api/CartItems/update-quantity", data);
    toast.success(res.data.message || "Cập nhật giỏ hàng thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data || "Cập nhật thất bại");
    throw error;
  }
};

// XOÁ SẢN PHẨM
export const deleteFromCart = async (cartItemId: number) => {
  try {
    const res = await api.delete(`/api/CartItems/delete/${cartItemId}`);
    toast.success(res.data.message || "Đã xoá sản phẩm khỏi giỏ hàng");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data || "Xoá sản phẩm thất bại");
    throw error;
  }
};
