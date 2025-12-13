import api from "./api";
import { toast } from "react-toastify";

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("File", file);

    const res = await api.post("/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Upload ảnh thành công");
    return res.data.imageUrl;
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Upload ảnh thất bại");
    throw error;
  }
};
