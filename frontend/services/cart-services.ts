import api from "./api";

export const getCart = async () => {
    const res = await api.get("/api/CartItems/get");
    return res.data;
};

export const createCart = async (data: any) => {
    const res = await api.post("/api/CartItems/add", data);
    return res.data;
};

export const updateQuantity = async (data: any) => {
    const res = await api.put("/api/CartItems/update-quantity", data);
    return res.data;
};

export const deleteCart = async (productId: number) => {
    const res = await api.delete(`/api/CartItems/delete/${productId}`);
    return res.data;
};