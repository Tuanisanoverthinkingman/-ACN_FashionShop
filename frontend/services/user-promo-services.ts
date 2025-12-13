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
// GET /api/user-promotions/my
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
// GET /api/user-promotions/available
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
// POST /api/user-promotions/claim/{id}
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
// 4. Check promo áp cho product
// ===============================
export const isPromoApplicable = (
  promo: UserPromotion,
  productId: number,
  categoryId?: number
): boolean => {
  switch (promo.applyType) {
    case 0: // General
    case 3: // User
      return true;
    case 1: // Product
      return promo.productIds.includes(productId);
    case 2: // Category
      return categoryId ? promo.categoryIds.includes(categoryId) : false;
    default:
      return false;
  }
};
