import api from "./api";

export const getAll = async () => {
    const res = await api.get("/api/users/getAll");
    return res.data;
};

export const getById = async (id: number) => {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
};

export const getMe = async () => {
    const res = await api.get("/api/users/me");
    return res.data;
};

export const createUser = async (data: any) => {
    const res = await api.post("/api/users/User", data);
    return res.data;
};

export const createSupplier = async (data: any) => {
    const res = await api.post("/api/users/Supplier", data);
    return res.data;
};

export const updatePassword = async (id: number, oldPassword: string, newPassword: string) => {
    const res = await api.put(`/api/users/${id}/change-password`, {
        oldPassword: oldPassword,
        newPassword: newPassword,
    });
    return res.data;
};

export const deleteUser = async (id: number) => {
    const res = await api.delete(`/api/users/${id}`);
    return res.data;
};

export const updateUser = async (id: number, data: any) => {
  const res = await api.put(`/api/users/${id}`, data);
  return res.data;
};