import api from "./api";
import { toast } from "react-toastify";

// 1. Upload ảnh lên server
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    // Lưu ý: Key phải khớp với [FromForm] File trong C# (đã sửa thành "File")
    formData.append("File", file);

    const res = await api.post("/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Tải ảnh lên thành công! 📸");
    return res.data.imageUrl;
  } catch (error: any) {
    const message = error.response?.data?.message || "Upload ảnh thất bại";
    toast.error(message);
    throw error;
  }
};

// 2. Xóa ảnh khỏi server (Để dọn dẹp khi Admin đổi ảnh hoặc xóa sản phẩm)
export const deleteImageFromServer = async (imageUrl: string): Promise<void> => {
  try {
    // Truyền imageUrl qua query string như Backend đã định nghĩa
    await api.delete(`/api/files/delete`, {
      params: { imageUrl }
    });
    console.log("Đã dọn dẹp ảnh cũ trên server");
  } catch (error: any) {
    // Không nhất thiết phải toast lỗi này cho Admin, chỉ cần log để debug
    console.error("Lỗi xóa ảnh cũ:", error.response?.data?.message || error.message);
  }
};