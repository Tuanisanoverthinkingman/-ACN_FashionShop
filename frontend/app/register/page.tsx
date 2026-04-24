"use client";

import { useState } from "react";
import { createUser } from "@/services/user-services";
import { sendVerificationEmail } from "@/services/emailAndOTPServices";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.username) return toast.error("Vui lòng nhập tài khoản!");
        if (!form.fullName) return toast.error("Vui lòng nhập họ và tên!");
        if (!form.email) return toast.error("Vui lòng nhập email!");
        if (!form.phone) return toast.error("Vui lòng nhập số điện thoại!");
        if (!form.password) return toast.error("Vui lòng nhập mật khẩu!");
        if (!form.confirmPassword) return toast.error("Vui lòng nhập lại mật khẩu!");
        if (form.password !== form.confirmPassword) return toast.error("Mật khẩu không khớp!");

        setLoading(true);
        try {
            await createUser({
                username: form.username,
                email: form.email,
                password: form.password,
                fullName: form.fullName,
                phone: form.phone,
            });

            try {
                await sendVerificationEmail(form.email);
                toast.success("Đăng ký thành công 🎉. Vui lòng kiểm tra email để xác thực!");
                router.push("/login");
            } catch (emailErr: any) {
                toast.error(emailErr.response?.data?.message || "Gửi email thất bại!");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Đăng ký thất bại 😢");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#e2ebf5] font-['Poppins'] p-4 py-20">
            <div className="bg-white/90 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 w-full max-w-lg">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Tạo tài khoản mới
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">Vui lòng điền đầy đủ các thông tin bên dưới</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Luồng 1 cột duy nhất */}
                    <div className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Tên đăng nhập</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Nhập tên đăng nhập..."
                                value={form.username}
                                onChange={handleChange}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Họ và tên</label>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Nhập họ và tên của bạn..."
                                value={form.fullName}
                                onChange={handleChange}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="example@gmail.com"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                placeholder="Ví dụ: 0912345678"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Tối thiểu 6 ký tự..."
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all pr-12 placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu để xác nhận..."
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all pr-12 placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#8bb4f6] hover:bg-[#7aa6eb] active:scale-[0.98] text-white p-4 rounded-xl transition-all font-semibold shadow-sm shadow-blue-200/50 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>
                        Bạn đã có tài khoản?{" "}
                        <span
                            onClick={() => router.push("/login")}
                            className="text-[#79a2eb] hover:text-[#5e8ce1] font-semibold cursor-pointer transition-colors"
                        >
                            Đăng nhập ngay
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}