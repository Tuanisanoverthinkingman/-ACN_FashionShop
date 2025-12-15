// pages/ForgotPasswordPage.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
    sendOtp,
    verifyOtp,
    resetPasswordWithToken
} from "@/services/emailAndOTPServices";

type OtpInputProps = {
    length: number;
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    onVerify: (otp: string) => void;
    resendOtp: () => void;
    timerDuration?: number;
    loading?: boolean;
};

function OtpInput({
    length,
    otp,
    setOtp,
    onVerify,
    resendOtp,
    timerDuration = 60,
    loading = false,
}: OtpInputProps) {
    const [timer, setTimer] = useState(timerDuration);
    const [timerKey, setTimerKey] = useState(0); // key để reset interval khi resend
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
    }, [timerKey, timerDuration]); // mỗi lần resend hoặc timerDuration thay đổi

    useEffect(() => {
        // Nếu toàn bộ otp rỗng → focus lại ô đầu
        if (otp.every(d => d === "")) {
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 0);
        }
    }, [otp]);

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
        } else if (e.key === "Enter") {
if (otp.every(d => d !== "")) onVerify(otp.join(""));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasteData = e.clipboardData.getData("Text").trim();
        if (/^\d+$/.test(pasteData)) {
            const chars = pasteData.split("").slice(0, length);
            setOtp(chars);
            const nextIndex = Math.min(chars.length, length - 1);
            inputsRef.current[nextIndex]?.focus();
            if (chars.length === length) onVerify(chars.join(""));
        }
    };

    const handleResendClick = async () => {
        await resendOtp();
        setOtp(Array(length).fill(""));
        setTimerKey(prev => prev + 1); // reset interval
        setTimeout(() => inputsRef.current[0]?.focus(), 0);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex gap-2">
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
                        onPaste={handlePaste}
                        className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ))}
            </div>
            <div className="mt-2 flex flex-col items-center gap-2">
                {timer > 0 ? (
                    <p className="text-sm text-gray-500">
                        OTP hết hạn sau: 00:{timer.toString().padStart(2, "0")}
                    </p>
                ) : (
                    <button
                        onClick={handleResendClick}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                        {loading ? "Đang gửi lại OTP..." : "Gửi lại OTP"}
                    </button>
                )}
            </div>
        </div>
    );
}

// Main Component
export default function ForgotPasswordPage() {
    const OTP_LENGTH = 6;
    const [step, setStep] = useState<"email" | "otp" | "reset">("email");
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));

    const [email, setEmail] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
const router = useRouter();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSendOtp = async () => {
        if (!email) return toast.error("Vui lòng nhập email");
        if (!emailRegex.test(email)) return toast.error("Email không hợp lệ");
        setLoading(true);
        try {
            await sendOtp(email);
            setStep("otp");
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otpValue: string) => {
        setLoading(true);
        try {
            const res = await verifyOtp(email, otpValue);
            setResetToken(res.resetToken);
            toast.success("OTP xác thực thành công 🎉");
            setOtpVerified(true);
            setStep("reset");
        } catch (err) {
            toast.error("OTP không đúng, vui lòng thử lại 😥");

            // ✅ RESET OTP INPUT
            setOtp(Array(OTP_LENGTH).fill(""));
        } finally {
            setLoading(false);
        }
    };


    const handleResetPassword = async () => {
        if (!password || !confirmPass)
            return toast.error("Vui lòng nhập đầy đủ mật khẩu");
        if (password !== confirmPass)
            return toast.error("Mật khẩu xác nhận không khớp");

        setLoading(true);
        try {
            await resetPasswordWithToken(email, resetToken, password);
            toast.success("Đổi mật khẩu thành công 🎉");
            setStep("email");
            setEmail("");
            setOtpVerified(false);
            setResetToken("");
            setPassword("");
            setConfirmPass("");
            router.push("/login");
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">
                    {step === "email"
                        ? "Nhập Email"
                        : step === "otp"
                            ? "Nhập OTP"
                            : "Đặt mật khẩu mới"}
                </h2>

                {step === "email" && (
                    <div className="flex flex-col gap-3">
                        <input
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                            className="w-full border p-3 rounded mb-4"
                        />
                        <button
                            onClick={handleSendOtp}
disabled={loading}
                            className="w-full bg-blue-500 text-white p-3 rounded"
                        >
                            {loading ? "Đang gửi OTP..." : "Gửi OTP"}
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
                    <div className="flex flex-col gap-3">
                        <input
                            type="password"
                            placeholder="Mật khẩu mới"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                            className="w-full border p-3 rounded"
                        />
                        <input
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                            className="w-full border p-3 rounded"
                        />
                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full bg-purple-500 text-white p-3 rounded"
                        >
                            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}