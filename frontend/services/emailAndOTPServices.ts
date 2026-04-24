import api from "./api";
import { toast } from "react-toastify";

export const sendOtp = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-otp", {
      EmailOrPhone: email,
      IsEmail: true,
    });

    return res.data;
  } catch (error: any) {
    throw error;
  }
};

// 2. Xác thực OTP → nhận resetToken (Khớp với VerifyOtpRequest)
export const verifyOtp = async (email: string, otp: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-otp", {
      EmailOrPhone: email,
      Otp: otp,
    });
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

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
    throw error;
  }
};

// 4. Gửi email xác thực tài khoản (Khớp với SendEmailRequest)
export const sendVerificationEmail = async (email: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/send-verification-email", {
      Email: email, 
    });
    toast.success(res.data.message || "Email xác thực đã được gửi");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || error.response?.data || "Gửi email xác thực thất bại");
    throw error;
  }
};

// 5. Xác thực email token (Khớp với VerifyEmailRequest)
export const verifyEmailToken = async (email: string, token: string) => {
  try {
    const res = await api.post("/api/EmailAndOTP/verify-email", {
      Email: email,
      Token: token,
    });
    toast.success(res.data.message || "Xác thực email thành công");
    return res.data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || error.response?.data || "Xác thực email thất bại");
    throw error;
  }
};