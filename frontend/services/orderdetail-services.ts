import api from "./api";

export const getForAdmin = async (orderId: number) => {
    const res = await api.get(`/api/orderdetails/order/${orderId}`);
    return res.data;
};

export const getForUser = async (orderId: number) => {
    const res = await api.get(`/api/orderdetails/user/${orderId}`);
    return res.data;
};