import api from "./api";
import { toast } from "react-toastify";

// Interface để gợi ý code khi làm UI chi tiết đơn hàng
export interface OrderDetailData {
  orderDetailId: number;
  orderId: number;
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  productVariant: {
    size: string;
    color: string;
    product: {
      id: number;
      name: string;
      imageUrl: string;
    };
  };
}

// 1. Lấy chi tiết đơn hàng cho Admin
export const getOrderDetailsForAdmin = async (orderId: number): Promise<OrderDetailData[] | undefined> => {
  try {
    const res = await api.get(`/api/orderdetails/order/${orderId}`);
    // Bỏ toast.success ở đây để Admin xem đơn hàng mượt mà, không bị hiện popup liên tục
    return res.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data || "Lấy chi tiết đơn hàng thất bại";
    toast.error(message);
    throw error;
  }
};

// 2. Lấy chi tiết đơn hàng cho User (chỉ đơn của mình)
export const getOrderDetailsForUser = async (orderId: number): Promise<OrderDetailData[] | undefined> => {
  try {
    const res = await api.get(`/api/orderdetails/user/${orderId}`);
    return res.data;
  } catch (error: any) {
    // Với User, nếu lỗi 403 (Forbid) hoặc 404 thì Backend trả về message, ta hiện lên luôn
    const message = error.response?.data?.message || error.response?.data || "Không có quyền xem đơn hàng này";
    toast.error(message);
    throw error;
  }
};