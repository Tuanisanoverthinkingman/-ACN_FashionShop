import api from "./api";

export const login = async (name: string, password: string) => {
    const res = await api.post("/api/products/{id}", {name, password});

    const token = res.data.token || res.data.Token;
    const user = res.data.user || res.data.User;

    if (!token || !user) throw new Error("Đăng nhập thất bại!!!");

    localStorage.setItem("token", token);
    localStorage.setItem("user", user);
    window.dispatchEvent(new Event("userChagned!!!"));

    return {token, user};
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged!!!"));
};