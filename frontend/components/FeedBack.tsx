"use client";

import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import {
  getFeedbackByProduct,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  FeedbackData,
} from "@/services/feedback-services";
import { toast } from "react-toastify";

interface FeedbackProps {
  productId: number;
  currentUserId: number;
  isAdmin?: boolean;
}

export default function Feedback({
  productId,
  currentUserId,
  isAdmin,
}: FeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);

  // Tạo mới
  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Chỉnh sửa
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState(0);
  const [editingHover, setEditingHover] = useState(0);

  // Lấy feedback
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      // API này giờ đã tự động chỉ trả về các feedback có status == 0 (đang hiển thị)
      const data = await getFeedbackByProduct(productId);
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [productId]);

  // Tạo feedback
  const handleCreate = async () => {
    if (!newContent || newRating < 1 || newRating > 5) {
      toast.error("Vui lòng nhập đánh giá và chọn sao");
      return;
    }

    try {
      await createFeedback({
        productId,
        content: newContent,
        rating: newRating,
      });

      setNewContent("");
      setNewRating(0);
      setHoverRating(0);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  // Cập nhật feedback (Dành cho User sửa bài của mình)
  const handleUpdate = async (id: number) => {
    if (!editingContent || editingRating < 1 || editingRating > 5) {
      toast.error("Nội dung và đánh giá hợp lệ từ 1-5");
      return;
    }

    try {
      await updateFeedback(id, {
        content: editingContent,
        rating: editingRating,
      });

      setEditingId(null);
      fetchFeedbacks();
      toast.success("Đã cập nhật đánh giá!");
    } catch (err) {
      console.error(err);
    }
  };

  // Xoá feedback (Xóa cứng - User xóa bài của họ)
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá feedback này?")) return;

    try {
      await deleteFeedback(id);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  // Render sao
  const renderStars = (
    rating: number,
    setRating?: (v: number) => void,
    hover?: number,
    setHover?: (v: number) => void
  ) =>
    Array.from({ length: 5 }).map((_, i) => {
      const filled = hover && hover > 0 ? i < hover : i < rating;
      return (
        <FaStar
          key={i}
          size={18}
          className={`transition-colors ${
            filled ? "text-yellow-400" : "text-gray-200"
          } ${setRating ? "cursor-pointer hover:scale-110" : ""}`}
          onClick={() => setRating && setRating(i + 1)}
          onMouseEnter={() => setHover && setHover(i + 1)}
          onMouseLeave={() => setHover && setHover(0)}
        />
      );
    });

  if (loading) return <div className="mt-10 text-gray-500 animate-pulse">Đang tải đánh giá...</div>;

  return (
    <div className="mt-10 font-['Poppins']">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block"></span>
        Đánh giá từ khách hàng ({feedbacks.length})
      </h2>

      {/* Tạo feedback */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">Chất lượng sản phẩm:</span>
          <div className="flex gap-1">
            {renderStars(newRating, setNewRating, hoverRating, setHoverRating)}
          </div>
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl p-3 mb-3 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm text-gray-700"
          rows={3}
          placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={!newContent || newRating === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-xl transition-colors shadow-sm"
          >
            Gửi đánh giá
          </button>
        </div>
      </div>

      {/* Danh sách feedback */}
      {feedbacks.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét sản phẩm này!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col gap-3"
            >
              {/* Header: User Info & Stars & Date */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {(f.userName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 text-sm block">
                      {f.userId === currentUserId ? "Bạn" : f.userName || "Người dùng ẩn danh"}
                    </span>
                    <div className="flex gap-1 mt-0.5">
                      {editingId === f.id
                        ? renderStars(editingRating, setEditingRating, editingHover, setEditingHover)
                        : renderStars(f.rating)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px] text-gray-400 font-medium">
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : ""}
                  </span>
                  {/* Nút Sửa/Xóa của User */}
                  {(isAdmin || f.userId === currentUserId) && editingId !== f.id && (
                    <div className="flex gap-3 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setEditingId(f.id!);
                          setEditingContent(f.content);
                          setEditingRating(f.rating);
                          setEditingHover(0);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(f.id!)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        Xoá
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Body: Content or Edit Mode */}
              {editingId === f.id ? (
                <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <textarea
                    className="w-full border-none bg-transparent resize-none outline-none text-sm text-gray-700 mb-3"
                    rows={2}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={() => handleUpdate(f.id!)}
                      className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Lưu lại
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm leading-relaxed ml-1">{f.content}</p>
              )}

              {/* ========================================================== */}
              {/* PHẦN HIỂN THỊ PHẢN HỒI CỦA ADMIN (CHỈ HIỆN KHI KHÔNG SỬA) */}
              {/* ========================================================== */}
              {!editingId && f.adminReply && (
                <div className="mt-2 ml-4 bg-gray-50 p-4 rounded-xl border-l-4 border-blue-500 relative">
                  {/* Mũi tên trỏ lên cho điệu đà */}
                  <div className="absolute -top-2 left-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-gray-50"></div>
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Phản hồi từ Nova Store
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {f.replyAt ? new Date(f.replyAt).toLocaleDateString('vi-VN') : ""}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm italic">
                    {f.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}