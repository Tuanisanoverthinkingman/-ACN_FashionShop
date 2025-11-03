import api from "./api";

export const getAll = async () => {
    const res = await api.get("/api/categories");
    return res.data;
};

export const getById = async (id: number) => {
    const res = await api.get(`/api/categories/${id}`);
    return res.data;
};

export const createCategory = async (data: any) => {
    const res = await api.post("/api/categories");
    return res.data;
};

export const updateCategory = async (id: any, data: any) => {
    const res = await api.put(`/api/categories/${id}`, data);
    return res.data;
};

export const deleteCategory = async (id: number) => {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
};