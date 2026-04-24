"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react"; // Thêm icon cho sinh động
import {
    sendOtp,
    verifyOtp,
    resetPasswordWithToken
} from "@/services/emailAndOTPServices";

// --- OTP Input Component (Đã nâng cấp UI) ---
type OtpInputProps = {
    length: number;
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    onVerify: (otp: string) => void;
    resendOtp: () => void;
    timerDuration?: number;
    loading?: boolean;
};

function OtpInput({ length, otp, setOtp, onVerify, resendOtp, timerDuration = 60, loading = false }: OtpInputProps) {
    const [timer, setTimer] = useState(timerDuration);
    const [timerKey, setTimerKey] = useState(0);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        setTimeout(() => inputsRef.current[0]?.focus(), 0);
    }, []);

    useEffect(() => {
        setTimer(timerDuration);
        const interval = setInterval(() => {
            setTimer(t => {
                if (t <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerKey, timerDuration]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value.trim();
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        if (value.length === 1) {
            newOtp[index] = value;
            setOtp(newOtp);
            if (index < length - 1) inputsRef.current[index + 1]?.focus();
        } else if (value.length === length) {
            const chars = value.split("").slice(0, length);
            setOtp(chars);
            inputsRef.current[length - 1]?.focus();
            onVerify(chars.join(""));
            return;
        }
        if (newOtp.every(d => d !== "")) onVerify(newOtp.join(""));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const newOtp = [...otp];
            if (otp[index] !== "") {
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
                const prevOtp = [...otp];
                prevOtp[index - 1] = "";
                setOtp(prevOtp);
            }
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-6">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { inputsRef.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={loading}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-12 h-14 text-center text-2xl font-bold border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] focus:border-[#9cbbf1] transition-all"
                    />
                ))}
            </div>
            <div className="text-center">
                {timer > 0 ? (
                    <p className="text-sm text-slate-500 font-medium">
                        Mã hết hạn sau <span className="text-[#79a2eb]">00:{timer.toString().padStart(2, "0")}</span>
                    </p>
                ) : (
                    <button
                        onClick={() => { resendOtp(); setTimerKey(k => k + 1); }}
                        disabled={loading}
                        className="text-[#79a2eb] hover:text-[#5e8ce1] font-semibold text-sm transition-colors underline underline-offset-4"
                    >
                        Gửi lại mã OTP
                    </button>
                )}
            </div>
        </div>
    );
}

// --- Main Page ---
export default function ForgotPasswordPage() {
    const OTP_LENGTH = 6;
    const router = useRouter();
    const [step, setStep] = useState<"email" | "otp" | "reset">("email");
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [email, setEmail] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    const handleSendOtp = async () => {
        if (!email.trim()) return toast.error("Vui lòng nhập email");
        setLoading(true);
        try {
            await sendOtp(email);
            setStep("otp");
        } catch (err: any) {
            console.error("Lỗi chi tiết khi gửi OTP:", err.response?.data);
            const backendMessage = err.response?.data?.message || err.response?.data;
            if (backendMessage) {
                if (typeof backendMessage === 'object') {
                    toast.error("Dữ liệu không hợp lệ, vui lòng kiểm tra lại!");
                } else {
                    toast.error(backendMessage);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otpValue: string) => {
        setLoading(true);
        try {
            const res = await verifyOtp(email, otpValue);
            setResetToken(res.resetToken);
            setOtpVerified(true);
            setStep("reset");
            toast.success("Xác thực OTP thành công");
        } catch (err) {
            toast.error("Mã OTP không chính xác");
            setOtp(Array(OTP_LENGTH).fill(""));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (password !== confirmPass) return toast.error("Mật khẩu không khớp");
        setLoading(true);
        try {
            await resetPasswordWithToken(email, resetToken, password);
            toast.success("Đổi mật khẩu thành công 🎉");
            router.push("/login");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#e2ebf5] p-4 font-['Poppins']">
            <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 w-full max-w-md">

                {/* Nút quay lại (Chỉ hiện ở bước email và otp) */}
                {step !== "reset" && (
                    <button
                        onClick={() => step === "otp" ? setStep("email") : router.back()}
                        className="flex items-center text-slate-400 hover:text-slate-600 transition-colors text-sm mb-6 font-medium group"
                    >
                        <ArrowLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                        Quay lại
                    </button>
                )}

                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-[#8bb4f6] mb-4">
                        {step === "email" && <Mail size={28} />}
                        {step === "otp" && <ShieldCheck size={28} />}
                        {step === "reset" && <KeyRound size={28} />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {step === "email" ? "Quên mật khẩu?" : step === "otp" ? "Xác thực OTP" : "Mật khẩu mới"}
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        {step === "email" && "Nhập email của bạn để nhận mã khôi phục"}
                        {step === "otp" && `Chúng tôi đã gửi mã đến ${email}`}
                        {step === "reset" && "Hãy tạo một mật khẩu mạnh để bảo vệ tài khoản"}
                    </p>
                </div>

                {/* --- Step: EMAIL --- */}
                {step === "email" && (
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Địa chỉ Email</label>
                            <input
                                type="email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="w-full bg-[#8bb4f6] hover:bg-[#7aa6eb] text-white p-3.5 rounded-xl transition-all font-semibold shadow-sm disabled:opacity-70"
                        >
                            {loading ? "Đang xử lý..." : "Tiếp tục"}
                        </button>
                    </div>
                )}

                {step === "otp" && (
                    <OtpInput
                        length={OTP_LENGTH}
                        otp={otp}
                        setOtp={setOtp}
                        onVerify={handleVerifyOtp}
                        resendOtp={handleSendOtp}
                        loading={loading}
                    />
                )}

                {step === "reset" && otpVerified && (
                    <div className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Mật khẩu mới</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-slate-600">Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9cbbf1] transition-all"
                            />
                        </div>
                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full bg-[#8bb4f6] hover:bg-[#7aa6eb] text-white p-3.5 rounded-xl transition-all font-semibold shadow-sm disabled:opacity-70"
                        >
                            {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}