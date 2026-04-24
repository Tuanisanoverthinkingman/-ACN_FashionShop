import api from "./api";
import { toast } from "react-toastify";

export enum PromotionApplyType {
  General = 0,
  Product = 1,
  Category = 2,
  User = 3,
}

export enum PromotionStatus {
  Active = 0,
  Expired = 1,
}

export interface Promotion {
  promotionId: number;
  code: string;
  discountPercent: number;
  applyType: PromotionApplyType;
  description?: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;

  productIds: number[];
  categoryIds: number[];
  userIds: number[];

  productNames?: string[];
  categoryNames?: string[];
}

const transformPromotion = (promo: any): Promotion => ({
  promotionId: promo.promotionId,
  code: promo.code,
  discountPercent: promo.discountPercent,
  applyType: promo.applyType,
  description: promo.description,
  startDate: promo.startDate,
  endDate: promo.endDate,
  status: promo.status,
  productIds: promo.productIds ?? [],
  categoryIds: promo.categoryIds ?? [],
  userIds: promo.userIds ?? [],
  productNames: promo.productNames ?? [],
  categoryNames: promo.categoryNames ?? [],
});

const handleError = (error: any) => {
  const message = error.response?.data?.message || error.response?.data || "Có lỗi xảy ra liên quan đến khuyến mãi";
  toast.error(message);
};

// 1. PUBLIC - Lấy các khuyến mãi đang hiệu lực (Đã lọc SP Soft Delete ở Backend)
export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const res = await api.get("/api/promotions");
    return res.data.map(transformPromotion);
  } catch (error) {
    handleError(error);
    return [];
  }
};

// 2. ADMIN - Lấy tất cả (Bao gồm cả SP đã xóa mềm nếu dùng IgnoreQueryFilters)
export const getAllPromotionsAdmin = async (): Promise<Promotion[]> => {
  try {
    const res = await api.get("/api/promotions/admin");
    return res.data.map(transformPromotion);
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const getPromotionById = async (id: number): Promise<Promotion | undefined> => {
  try {
    const res = await api.get(`/api/promotions/${id}`);
    return transformPromotion(res.data);
  } catch (error) {
    handleError(error);
  }
};

export const createPromotion = async (data: any) => {
  try {
    const res = await api.post("/api/promotions", data);
    toast.success(res.data.message || "Tạo khuyến mãi thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const updatePromotion = async (id: number, data: any) => {
  try {
    const res = await api.put(`/api/promotions/${id}`, data);
    toast.success(res.data.message || "Cập nhật khuyến mãi thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const deletePromotion = async (id: number) => {
  try {
    const res = await api.delete(`/api/promotions/${id}`);
    toast.success(res.data.message || "Đã xóa khuyến mãi");
  } catch (error) {
    handleError(error);
  }
};

export const togglePromotionStatus = async (id: number) => {
  try {
    const res = await api.put(`/api/promotions/${id}/status`);
    toast.success(res.data.message || "Đã thay đổi trạng thái khuyến mãi");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const getClaimablePromotions = async (): Promise<Promotion[]> => {
  try {
    const res = await api.get("/api/promotions/claimable");
    return res.data.map(transformPromotion);
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const isPromoApplicable = (
  promo: Promotion,
  productId: number,
  categoryId?: number
): boolean => {
  if (promo.status === PromotionStatus.Expired) return false;

  const now = new Date();
  if (new Date(promo.startDate) > now || new Date(promo.endDate) < now) return false;

  switch (promo.applyType) {
    case PromotionApplyType.General:
    case PromotionApplyType.User:
      return true;
    case PromotionApplyType.Product:
      return promo.productIds.includes(productId);
    case PromotionApplyType.Category:
      return categoryId ? promo.categoryIds.includes(categoryId) : false;
    default:
      return false;
  }
};