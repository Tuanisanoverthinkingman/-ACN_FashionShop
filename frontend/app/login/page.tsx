"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/services/auth-services";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) return toast.error("Vui lòng nhập tài khoản!");
        if (!password.trim()) return toast.error("Vui lòng nhập mật khẩu!");

        setLoading(true);

        try {
            const { user } = await login(username, password);

            toast.success("Đăng nhập thành công!");

            if (user.role === "Admin") {
                router.push("/admin");
            } else if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                router.push("/");
            }
        } catch (err: any) {
            toast.error(err.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#e2ebf5] font-['Poppins'] p-4">
            <div className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Đăng nhập
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">Chào mừng bạn quay trở lại!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-600">Tài khoản</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tài khoản..."
                            className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600">Mật khẩu</label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu..."
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
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-sm text-[#79a2eb] hover:text-[#5e8ce1] font-medium transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#8bb4f6] hover:bg-[#7aa6eb] active:scale-[0.98] text-white p-3.5 rounded-xl transition-all font-semibold shadow-sm shadow-blue-200/50 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-500">
                    <p>
                        Chưa có tài khoản?{" "}
                        <span
                            onClick={() => router.push("/register")}
                            className="text-[#79a2eb] hover:text-[#5e8ce1] font-semibold cursor-pointer transition-colors"
                        >
                            Đăng ký ngay
                        </span>
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/send-verify-email")}
                        className="hover:text-slate-700 transition-colors underline underline-offset-4 decoration-slate-300"
                    >
                        Gửi lại email xác thực
                    </button>
                </div>
            </div>
        </div>
    );
}