import axios from "axios";
import { config } from "process";

const api = axios.create({
    baseURL: "http://localhost:5146"
});

api.interceptors.request.use((config) => {
    if (typeof window !== undefined) {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;