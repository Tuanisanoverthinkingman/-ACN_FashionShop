import api from "./api";
import { toast } from "react-toastify";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  instock: number;
  imageUrl?: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  createAt?: string;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  instock: number;
  imageUrl?: string | null;
  categoryId: number;
}

export interface UploadExcelResult {
  message: string;
  errors?: string[];
}


// Helper handle lỗi
const handleError = (error: any) => {
  if (error.response?.data?.message) {
    toast.error(error.response.data.message);
  } else if (error.response?.data) {
    toast.error(JSON.stringify(error.response.data));
  } else {
    toast.error("Có lỗi xảy ra, thử lại sau");
  }
};

// Lấy tất cả sản phẩm
export const getAll = async (): Promise<Product[] | undefined> => {
  try {
    const res = await api.get("/api/products");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy sản phẩm theo id
export const getById = async (id: number): Promise<Product | undefined> => {
  try {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy sản phẩm theo categoryId
export const getByCategoryId = async (categoryId: number): Promise<Product[] | undefined> => {
  try {
    const res = await api.get(`/api/products/by-category/${categoryId}`);
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo sản phẩm mới (Admin)
export const createProduct = async (data: ProductRequest): Promise<Product | undefined> => {
  try {
    const res = await api.post("/api/products", data);
    toast.success("Tạo sản phẩm thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật sản phẩm (Admin)
export const updateProduct = async (id: number, data: ProductRequest): Promise<Product | undefined> => {
  try {
    const res = await api.put(`/api/products/${id}`, data);
    toast.success("Cập nhật sản phẩm thành công");
    return res.data;
  } catch (error) {
    handleError(error);
  }
};

// Xoá sản phẩm (Admin)
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    const res = await api.delete(`/api/products/${id}`);
    toast.success(res.data.message || "Xoá sản phẩm thành công");
  } catch (error) {
    handleError(error);
  }
};

// Upload Excel để thêm nhiều sản phẩm (Admin)
export const uploadExcelSheets = async (file: File): Promise<UploadExcelResult | undefined> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/api/products/upload-excel-sheets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.errors && res.data.errors.length > 0) {
      toast.warn(`Upload hoàn tất, có lỗi ở ${res.data.errors.length} row`);
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
    const response = await fetch(`http://localhost:5146/api/products/group/${keyword}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Lỗi fetch products by group:", error);
    return [];
  }
};

export const getSaleProducts = async (keyword?: string): Promise<Product[]> => {
  try {
    // Nếu có keyword thì gắn vào đuôi, không thì gọi API gốc
    const url = keyword 
      ? `http://localhost:5146/api/products/on-sale/${keyword}`
      : `http://localhost:5146/api/products/on-sale`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Lỗi fetch sale products:", error);
    return [];
  }
};