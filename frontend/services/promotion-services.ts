import api from "./api";
import { toast } from "react-toastify";

export type PromotionApplyType = "General" | "Product" | "Category" | "User";

export interface Promotion {
  promotionId: number;
  code: string;
  discountPercent: number;
  applyType: PromotionApplyType;
  description?: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expired";

  productIds: number[];
  categoryIds: number[];
  userIds: number[];

  // Mới thêm
  ProductNames?: string[];
  CategoryNames?: string[];
}

// ===============================
// Transform backend → frontend
// ===============================
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
  ProductNames: promo.productNames ?? [],
  CategoryNames: promo.categoryNames ?? [],
});

// ===============================
// Error handler
// ===============================
const handleError = (error: any) => {
  toast.error(error.response?.data?.message || "Có lỗi xảy ra");
};

// ===============================
// PUBLIC – Promotion active
// GET /api/promotions
// ===============================
export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const res = await api.get("/api/promotions");
    return res.data.map(transformPromotion);
  } catch (error) {
    handleError(error);
    return [];
  }
};

// ===============================
// ADMIN – All promotions
// GET /api/promotions/admin
// ===============================
export const getAllPromotionsAdmin = async (): Promise<Promotion[]> => {
  try {
    const res = await api.get("/api/promotions/admin");
    return res.data.map(transformPromotion);
  } catch (error) {
    handleError(error);
    return [];
  }
};

// ===============================
// ADMIN – Get by ID
// ===============================
export const getPromotionById = async (
  id: number
): Promise<Promotion | undefined> => {
  try {
    const res = await api.get(`/api/promotions/${id}`);
    return transformPromotion(res.data);
  } catch (error) {
    handleError(error);
  }
};

// ===============================
// ADMIN – Create
// ===============================
export const createPromotion = async (data: any) => {
  try {
    const res = await api.post("/api/promotions", data);
    toast.success(res.data.message);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// ===============================
// ADMIN – Update
// ===============================
export const updatePromotion = async (id: number, data: any) => {
  try {
    const res = await api.put(`/api/promotions/${id}`, data);
    toast.success(res.data.message);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// ===============================
// ADMIN – Delete
// ===============================
export const deletePromotion = async (id: number) => {
  try {
    const res = await api.delete(`/api/promotions/${id}`);
    toast.success(res.data.message);
  } catch (error) {
    handleError(error);
  }
};

// ===============================
// ADMIN – Toggle status
// ===============================
export const togglePromotionStatus = async (id: number) => {
  try {
    const res = await api.put(`/api/promotions/${id}/status`);
    toast.success(res.data.message);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};
