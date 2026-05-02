import api from "./api";

export const login = async (username: string, password: string) => {
  try {
    const res = await api.post("/api/auth/login", { username, password });
    if (!res.data?.user) {
      throw new Error(res.data?.message || "Đăng nhập thất bại");
    }

    const user = res.data.user;

    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("userChanged"));

    console.log("Login success, user:", user);
    return { user };
  } catch (err: any) {
    console.log("Login error full:", err);
    console.log("Server response:", err.response?.data);
    throw new Error(err.response?.data?.message || err.message || "Đăng nhập thất bại");
  }
};

export const logout = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch (error) {
    console.error("Lỗi khi gọi API đăng xuất:", error);
  } finally {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
  }
};