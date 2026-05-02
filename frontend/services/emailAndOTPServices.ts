import api from "./api";
import { toast } from "react-toastify";

// 1. Gửi OTP
export const sendOtp = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-otp", {
      EmailOrPhone: email,
      IsEmail: true,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi gửi OTP");
  }
};

// 2. Xác thực OTP → nhận resetToken
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-otp", {
      EmailOrPhone: email,
      Otp: otp,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Xác thực OTP thất bại");
  }
};

// 3. Reset Password
export const resetPasswordWithToken = async (
  email: string,
  resetToken: string,
  newPassword: string
) => {
  try {
    const res = await api.post("/api/EmailAndOTP/reset-password", {
      Email: email,
      ResetToken: resetToken,
      NewPassword: newPassword,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Đổi mật khẩu thất bại");
  }
};

// 4. Gửi email xác thực tài khoản
export const sendVerificationEmail = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-verification-email", {
      Email: email,
    });
    toast.success(res.data?.message || "Email xác thực đã được gửi");
    return res.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data || "Gửi email xác thực thất bại";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// 5. Xác thực email token
export const verifyEmailToken = async (email: string, token: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-email", {
      Email: email,
      Token: token,
    });
    toast.success(res.data?.message || res.data || "Xác thực email thành công");
    return res.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data || "Xác thực email thất bại";
    toast.error(errorMsg);
    throw new Error(errorMsg);
  }
};