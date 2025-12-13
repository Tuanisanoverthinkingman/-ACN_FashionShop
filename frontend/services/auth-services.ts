import api from "./api";

export const login = async (username: string, password: string) => {
  try {
    const res = await api.post("/api/auth/login", { username, password });

    if (!res.data?.token || !res.data?.user) {
      throw new Error(res.data?.message || "Đăng nhập thất bại 😢");
    }

    const token = res.data.token;
    const user = res.data.user;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("userChanged"));

    console.log("Login success, token & user:", token, user);
    return { token, user };
  } catch (err: any) {
    console.log("Login error full:", err);
    console.log("Server response:", err.response?.data);
    throw new Error(err.response?.data?.message || err.message || "Đăng nhập thất bại 😢");
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("userChanged"));
};
