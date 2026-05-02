import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5146",
  withCredentials: true 
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Phiên đăng nhập hết hạn hoặc không hợp lệ! Đang đăng xuất!");
      
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("userChanged"));
    }
    return Promise.reject(error);
  }
);

export default api;