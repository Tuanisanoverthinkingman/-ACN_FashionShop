import api from "./api";

export const getAll = async () => {
    const res = await api.get("/api/products");
    return res.data;
};

export const getById = async (id: number) => {
    const res = await api.get(`/api/products/${id}`);
    return res.data;
};

export const getByCategoryId = async (categoryId: number) => {
    const res = await api.get(`/api/products/by-category/${categoryId}`);
    return res.data;
};

export const createProduct = async (data: any) => {
    const res = await api.post("/api/products", data);
    return res.data;
};

export const updateProduct = async (id: number, data: any) => {
    const res = await api.put(`/api/products/${id}`, data);
    return res.data;
};

export const deleteProduct = async (id: number) => {
    const res = await api.delete(`/api/products/${id}`);
    return res.data;
};