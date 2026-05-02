import api from "./api";
import { toast } from "react-toastify";

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  color: string;
  imageUrl?: string;
  costPrice: number;
  price: number;
  instock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  createAt?: string;
  isDeleted: boolean;
  productVariants: ProductVariant[];
}

export interface ProductRequest {
  name: string;
  description: string;
  imageUrl?: string | null;
  categoryId: number;
  productVariants: Omit<ProductVariant, "id" | "productId">[];
}

export interface UploadExcelResult {
  message: string;
  errors?: string[];
}

export interface QuickSearchResponse {
  categories: { id: number; name: string }[];
  products: { id: number; name: string; imageUrl: string }[];
}

const handleError = (error: any) => {
  if (error.response?.data?.message) {
    toast.error(error.response.data.message);
  } else if (error.response?.data) {
    toast.error(JSON.stringify(error.response.data));
  } else {
    toast.error("Có lỗi xảy ra, thử lại sau");
  }
};

export const getAll = async (): Promise<Product[] | undefined> => {
  try {
    const res = await api.get("/api/products");
    console.log("Dữ liệu thực tế từ API:", res.data);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const getById = async (id: number): Promise<Product | undefined> => {
  try {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const getByCategoryId = async (categoryId: number): Promise<Product[] | undefined> => {
  try {
    const res = await api.get(`/api/products/by-category/${categoryId}`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const createProduct = async (data: ProductRequest): Promise<Product | undefined> => {
  try {
    const res = await api.post("/api/products", data);
    toast.success("Tạo sản phẩm thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateProduct = async (id: number, data: ProductRequest): Promise<Product | undefined> => {
  try {
    const res = await api.put(`/api/products/${id}`, data);
    toast.success("Cập nhật sản phẩm thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    const res = await api.delete(`/api/products/${id}`);
    toast.success(res.data.message || "Xoá sản phẩm thành công");
  } catch (error) {
    handleError(error);
  }
};

export const uploadExcelSheets = async (file: File): Promise<UploadExcelResult | undefined> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/api/products/upload-excel-sheets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.errors && res.data.errors.length > 0) {
      toast.warn(`Upload hoàn tất, có lỗi ở ${res.data.errors.length} dòng`);
    } else {
      toast.success("Upload Excel thành công");
    }
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const getProductsByGroup = async (keyword: string): Promise<Product[]> => {
  try {
    const res = await api.get(`/api/products/group/${keyword}`);
    return res.data;
  } catch (error) {
    console.error("Lỗi fetch products by group:", error);
    return [];
  }
};

export const getSaleProducts = async (keyword?: string): Promise<Product[]> => {
  try {
    const url = keyword 
      ? `/api/products/on-sale/${keyword}`
      : `/api/products/on-sale`;
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error("Lỗi fetch sale products:", error);
    return [];
  }
};

export const getAllForAdmin = async (): Promise<Product[] | undefined> => {
  try {
    const res = await api.get("/api/products/admin-all");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

export const restoreProduct = async (id: number): Promise<void> => {
  try {
    const res = await api.put(`/api/products/restore/${id}`);
    toast.success(res.data.message || "Khôi phục sản phẩm thành công");
  } catch (error) {
    handleError(error);
  }
};

export const quickSearch = async (query: string): Promise<QuickSearchResponse | null> => {
  try {
    const res = await fetch(`http://localhost:5146/api/products/quick-search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Lỗi khi tìm kiếm nhanh:", error);
    return null;
  }
};