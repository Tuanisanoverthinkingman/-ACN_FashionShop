import api from "./api";

export const getAll = async () => {
    const res = await api.get("/api/Order/getAll");
    return res.data;
};

export const getMe = async () => {
    const res = await api.get("/api/Order/user");
    return res.data;
};

export const getById =  async (id: number) => {
    const res = await api.get(`/api/Order/${id}`);
    return res.data;
};

export const createOrder = async (cartItemIds: number[]) => {
    const res = await api.post("/api/Order", cartItemIds);
    return res.data;
};

export const deleteOrder = async (id: number) => {
    const res = await api.delete(`/api/Order/${id}`);
    return res.data;
};