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

// ===============================
// Error handler
// ===============================
const handleError = (error: any) => {
  toast.error(error.response?.data?.message || "Có lỗi xảy ra");
};

// ===============================
// 1. Promo user đã claim
// ===============================
export const getMyPromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/my");
    return res.data;
  } catch (error) {
    handleError(error);
    return [];
  }
};

// ===============================
// 2. Promo có thể dùng (checkout)
// ===============================
export const getAvailablePromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/available");
    return res.data;
  } catch (error) {
    handleError(error);
    return [];
  }
};

// ===============================
// 3. Claim promotion
// ===============================
export const claimPromotion = async (promotionId: number) => {
  try {
    const res = await api.post(`/api/user-promotions/claim/${promotionId}`);
    if (res.data?.message) {
      toast.success(res.data.message);
    }
    return res.data;
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

// ===============================
// 4. Lấy promo áp dụng cho 1 product
// ===============================
export const getApplicablePromotionsForProduct = async (
  productId: number,
  categoryId?: number
): Promise<UserPromotion[]> => {
  try {
    const params = new URLSearchParams({ productId: productId.toString() });
    if (categoryId !== undefined) params.append("categoryId", categoryId.toString());

    const res = await api.get(`/api/user-promotions/applicable?${params.toString()}`);
    return res.data;
  } catch (error) {
    handleError(error);
    return [];
  }
};

export const getAllPromotionsForUser = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/all-for-user");
    return res.data;
  } catch (error) {
    handleError(error);
    return [];
  }
};

// ===============================
// 5. Check promo áp cho product
// ===============================
export const isPromoApplicable = (
  promo: UserPromotion,
  productId: number,
  categoryId?: number
): boolean => {
  switch (promo.applyType) {
    case PromotionApplyType.General:
    case PromotionApplyType.User:
      return true;
    case PromotionApplyType.Product:
      return promo.productIds.includes(productId);
    case PromotionApplyType.Category:
      return categoryId
        ? promo.categoryIds.includes(categoryId)
        : false;
    default:
      return false;
  }
};

export const getGeneralPromotions = async (): Promise<UserPromotion[]> => {
  try {
    const res = await api.get("/api/user-promotions/general");
    return res.data;
  } catch {
    return [];
  }
};
