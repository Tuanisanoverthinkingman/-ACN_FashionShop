import api from "./api";
import { toast } from "react-toastify";

export interface CartItem {
  cartItemId: number;
  productVariantId: number;
  quantity: number;
  isAvailable: boolean;
  variant: {
    size: string;
    color: string;
    price: number;
    inStock: number;
  };
  product: {
    id: number;
    name: string;
    imageUrl: string;
    categoryId: number;
  };
}

export const getCart = async (): Promise<CartItem[] | undefined> => {
  try {
    const res = await api.get("/api/CartItems/get");
    return res.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data || "Lấy giỏ hàng thất bại";
    toast.error(msg);
    throw error;
  }
};

export const addToCart = async (data: { productVariantId: number; quantity: number }) => {
  try {
    const res = await api.post("/api/CartItems/add", data);
    toast.success("Đã thêm vào giỏ hàng!");
    return res.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data || "Có lỗi xảy ra";
    toast.error(msg);
    throw error;
  }
};

export const updateCartQuantity = async (data: {
  cartItemId: number;
  quantity: number;
}) => {
  try {
    const res = await api.put("/api/CartItems/update-quantity", data);
    
    toast.success(res.data.message || "Cập nhật thành công");
    return res.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data || "Cập nhật thất bại";
    toast.error(msg);
    throw error;
  }
};

export const deleteFromCart = async (cartItemId: number) => {
  try {
    const res = await api.delete(`/api/CartItems/delete/${cartItemId}`);
    toast.success(res.data.message || "Đã xoá sản phẩm khỏi giỏ hàng");
    return res.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data || "Xoá sản phẩm thất bại";
    toast.error(msg);
    throw error;
  }
};