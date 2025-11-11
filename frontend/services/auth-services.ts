import api from "./api";

export const login = async (username: string, password: string) => {
    const res = await api.post("/api/auth/login", {username, password});

    const token = res.data.token || res.data.Token;
    const user = res.data.user || res.data.User;

    if (!token || !user) throw new Error("Đăng nhập thất bại!!!");

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("userChanged"));

    return {token, user};
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
};