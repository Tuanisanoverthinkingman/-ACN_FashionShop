"use client";

import { useState } from "react";
import { createUser } from "@/services/user-services";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();

    const [form, setForm] = useState({
        username: "",
        password: "",
        email: "",
        fullName: "",
        phone: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await createUser(form);
            setSuccess("Đăng ký thành công!");
            setTimeout(() => router.push("/login"), 1000);
        } catch (err: any) {
            setError(err.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-white/40">
                <div className="flex items-center justify-center mb-8 gap-3">
                    <img
                        src="/image/NovaLogo.png"
                        alt="Logo"
                        className="h-12 w-12 rounded-full object-cover shadow-md"
                    />
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                        <span className="font-bold">Nova</span> Store
                    </span>
                </div>

                {error && (
                    <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-md">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded-md">
                        {success}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Tên đăng nhập</label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all shadow-sm"
                            type="text"
                            placeholder="Tên đăng nhập"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Mật khẩu</label>
                        <input
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all shadow-sm"
                            type="password"
                            placeholder="Mật khẩu"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Email</label>
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            type="email"
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all shadow-sm"
                            placeholder="Email"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Họ và tên</label>
                        <input
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-purple-500 transition-all shadow-sm"
                            type="text"
                            placeholder="Họ và tên"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Số điện thoại</label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all shadow-sm"
                            type="text"
                            placeholder="Số điện thoại"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl shadow-lg hover:opacity-90 transition text-lg font-semibold"
                    >
                        {loading ? "Đang xử lý..." : "Đăng ký"}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600 text-sm">
                    Đã có tài khoản?{" "}
                    <a href="/login" className="text-blue-600 font-medium hover:underline">
                        Đăng nhập ngay
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
