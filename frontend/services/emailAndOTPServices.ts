import api from "./api";
import { toast } from "react-toastify";

// Gửi OTP
export const sendOtp = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-otp", {
      EmailOrPhone: email,
      IsEmail: true
    });
    toast.success(res.data.message || "OTP đã được gửi");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gửi OTP thất bại");
    throw error;
  }
};

// Xác thực OTP
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-otp", {
      EmailOrPhone: email,
      Otp: otp
    });
    toast.success(res.data.message || "Xác thực OTP thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xác thực OTP thất bại");
    throw error;
  }
};

// Gửi email xác thực tài khoản
export const sendVerificationEmail = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-verification-email", {
      Email: email
    });
    toast.success(res.data.message || "Email xác thực đã được gửi");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gửi email xác thực thất bại");
    throw error;
  }
};

// Xác thực email token
export const verifyEmailToken = async (email: string, token: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-email", {
      Email: email,
      Token: token
    });
    toast.success(res.data.message || "Xác thực email thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xác thực email thất bại");
    throw error;
  }
};
