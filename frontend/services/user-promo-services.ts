import api from "./api";
import { toast } from "react-toastify";

export enum PromotionApplyType {
  General = 0,
  Product = 1,
  Category = 2,
  User = 3,
}

export interface UserPromotion {
  promotionId: number;
  code: string;
  discountPercent: number;
  applyType: PromotionApplyType;
  isUsed: boolean;
  description?: string;
  startDate?: string;
  endDate?: string;
  productIds: number[];
  categoryIds: number[];
}

const handleError = (error: any) => {
  const message = error.response?.data?.message || error.response?.data || "Có lỗi xảy ra liên quan đến khuyến mãi";
  toast.error(message);
};

export const getMyPromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/my");
    return res.data ?? [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const getAvailablePromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/available");
    return res.data ?? [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const claimPromotion = async (promotionId: number) => {
  try {
    const res = await api.post(`/api/user-promotions/claim/${promotionId}`);
    toast.success(res.data?.message || "Nhận mã khuyến mãi thành công! 🎁");
    return res.data;
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

export const getApplicablePromotionsForProduct = async (
  productId: number,
  categoryId?: number
): Promise<UserPromotion[]> => {
  try {
    const params = new URLSearchParams({ productId: productId.toString() });
    if (categoryId !== undefined) params.append("categoryId", categoryId.toString());

    const res = await api.get(`/api/user-promotions/applicable?${params.toString()}`);
    return res.data ?? [];
  } catch (error) {
    console.error("Lỗi lấy mã giảm giá áp dụng:", error);
    return [];
  }
};

export const getAllPromotionsForUser = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/all-for-user");
    return res.data ?? [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const isPromoApplicable = (
  promo: UserPromotion,
  productId: number,
  categoryId?: number
): boolean => {
  if (promo.isUsed) return false;

  switch (promo.applyType) {
    case PromotionApplyType.General:
    case PromotionApplyType.User:
      return true;
    case PromotionApplyType.Product:
      return promo.productIds?.includes(productId) ?? false;
    case PromotionApplyType.Category:
      return categoryId
        ? (promo.categoryIds?.includes(categoryId) ?? false)
        : false;
    default:
      return false;
  }
};

export const getGeneralPromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/general");
    return res.data ?? [];
  } catch {
    return [];
  }
};