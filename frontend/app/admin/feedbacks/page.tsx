"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getAllFeedback,
  updateFeedback, // Đảm bảo bạn đã export hàm này bên service
  FeedbackData,
} from "@/services/feedback-services";

import { getAll } from "@/services/product-services";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff, FiMessageCircle, FiCheck, FiX } from "react-icons/fi";
import { FaStar } from "react-icons/fa";

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // State quản lý việc hiển thị khung trả lời
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedback();
      setFeedbacks(res || []);
    } catch (err) {
      toast.error("Không thể tải danh sách đánh giá.");
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await getAll();
      setProducts(res?.map((p: any) => ({ id: p.id, name: p.name })) || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchProducts();
  }, []);

  const productMap = useMemo(() => {
    const map: Record<number, string> = {};
    products.forEach(p => { map[p.id] = p.name; });
    return map;
  }, [products]);

  // --- 1. LOGIC ẨN / HIỆN (SOFT DELETE) ---
  const handleToggleStatus = async (fb: FeedbackData) => {
    // Nếu status là undefined (dữ liệu cũ), coi như là 0 (đang hiện)
    const currentStatus = fb.status ?? 0; 
    const newStatus = currentStatus === 0 ? 1 : 0;
    const actionText = newStatus === 1 ? "ẩn" : "hiển thị lại";

    try {
      await updateFeedback(fb.id!, { status: newStatus });
      toast.success(`Đã ${actionText} bình luận.`);
      fetchFeedbacks();
    } catch (err) {
      toast.error("Lỗi khi thay đổi trạng thái.");
    }
  };

  // --- 2. LOGIC TRẢ LỜI FEEDBACK ---
  const openReplyBox = (fb: FeedbackData) => {
    setReplyingId(fb.id!);
    setReplyContent(fb.adminReply || ""); // Nếu đã từng trả lời thì hiện lại nội dung cũ để sửa
  };

  const submitReply = async (id: number) => {
    if (!replyContent.trim()) {
      toast.warn("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    try {
      await updateFeedback(id, { adminReply: replyContent });
      toast.success("Đã gửi phản hồi thành công!");
      setReplyingId(null);
      setReplyContent("");
      fetchFeedbacks();
    } catch (err) {
      toast.error("Lỗi khi gửi phản hồi.");
    }
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyContent("");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar key={star} className={star <= rating ? "text-yellow-400" : "text-gray-200"} size={14} />
        ))}
      </div>
    );
  };

  // Tính toán thống kê nhanh
  const visibleCount = feedbacks.filter(f => (f.status ?? 0) === 0).length;
  const hiddenCount = feedbacks.filter(f => f.status === 1).length;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-['Poppins']">
      <div className="max-w-7xl mx-auto">
        
        {/* Tiêu đề & Thống kê */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-400 rounded-full inline-block"></span>
            Quản lý Đánh giá & Phản hồi
          </h1>
          <div className="flex gap-4">
             <span className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-medium">
                Đang hiển thị: <span className="text-emerald-500">{visibleCount}</span>
             </span>
             <span className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-medium">
                Đã ẩn: <span className="text-rose-500">{hiddenCount}</span>
             </span>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-indigo-500 animate-pulse font-medium">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/30 text-xs text-indigo-800 uppercase tracking-wider">
                    <th className="p-4 font-semibold w-1/5">Sản phẩm</th>
                    <th className="p-4 font-semibold w-1/6">Đánh giá</th>
                    <th className="p-4 font-semibold w-[45%]">Nội dung & Phản hồi</th>
                    <th className="p-4 font-semibold text-center">Trạng thái</th>
                    <th className="p-4 font-semibold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {feedbacks.map((fb) => {
                    const isHidden = fb.status === 1;
                    const isReplying = replyingId === fb.id;

                    return (
                      <tr key={fb.id} className={`transition-colors ${isHidden ? 'bg-gray-50/60' : 'hover:bg-indigo-50/10'}`}>
                        {/* 1. Tên Sản Phẩm */}
                        <td className={`p-4 font-medium ${isHidden ? 'text-gray-400' : 'text-gray-700'}`}>
                          {fb.productId ? (productMap[fb.productId] ?? "SP #" + fb.productId) : "-"}
                        </td>
                        
                        {/* 2. Số sao */}
                        <td className={`p-4 ${isHidden ? 'opacity-50' : ''}`}>
                          {renderStars(fb.rating)}
                          <span className="text-[10px] text-gray-400 uppercase mt-1 block">{fb.rating} sao</span>
                        </td>
                        
                        {/* 3. Nội dung khách + Khung phản hồi Admin */}
                        <td className="p-4">
                          <p className={`italic ${isHidden ? 'text-gray-400' : 'text-gray-600'}`}>"{fb.content}"</p>
                          
                          {/* Khung nhập phản hồi (nếu đang bấm nút Trả lời) */}
                          {isReplying ? (
                            <div className="mt-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col gap-2">
                              <textarea
                                className="w-full text-sm p-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                rows={2}
                                placeholder="Nhập câu trả lời của Nova Store..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={cancelReply} className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors">
                                  <FiX /> Hủy
                                </button>
                                <button onClick={() => submitReply(fb.id!)} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                                  <FiCheck /> Gửi
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Hiển thị câu trả lời đã gửi (nếu có) */
                            fb.adminReply && (
                              <div className={`mt-2 p-2.5 rounded-lg border-l-2 text-xs ${isHidden ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-indigo-50 border-indigo-400 text-indigo-700'}`}>
                                <span className="font-bold block mb-0.5">Nova Store phản hồi:</span>
                                {fb.adminReply}
                              </div>
                            )
                          )}
                        </td>
                        
                        {/* 4. Huy hiệu Trạng thái */}
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isHidden ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isHidden ? "Đã ẩn" : "Hiển thị"}
                          </span>
                        </td>
                        
                        {/* 5. Nút Thao tác */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className={`p-2 rounded-lg transition-colors ${isReplying ? 'bg-indigo-100 text-indigo-600' : 'text-indigo-400 hover:bg-indigo-50'}`}
                              onClick={() => openReplyBox(fb)}
                              title="Trả lời khách hàng"
                            >
                              <FiMessageCircle size={18} />
                            </button>
                            
                            <button
                              className={`p-2 rounded-lg transition-colors ${isHidden ? 'text-emerald-500 hover:bg-emerald-50' : 'text-rose-500 hover:bg-rose-50'}`}
                              onClick={() => handleToggleStatus(fb)}
                              title={isHidden ? "Hiện lại bình luận" : "Ẩn bình luận này"}
                            >
                              {isHidden ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {feedbacks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-gray-400 italic">Chưa có đánh giá nào từ khách hàng.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}