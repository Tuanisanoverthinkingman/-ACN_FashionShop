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

  // Cập nhật feedback
  const handleUpdate = async (id: number) => {
    if (!editingContent || editingRating < 1 || editingRating > 5) {
      toast.error("Nội dung và đánh giá hợp lệ từ 1-5");
      return;
    }

    try {
      await updateFeedback(id, {
        productId,
        content: editingContent,
        rating: editingRating,
      });

      setEditingId(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  // Xoá feedback
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
          size={22}
          className={`transition-colors ${filled ? "text-yellow-400" : "text-gray-300"
            } ${setRating ? "cursor-pointer" : ""}`}
          onClick={() => setRating && setRating(i + 1)}
          onMouseEnter={() => setHover && setHover(i + 1)}
          onMouseLeave={() => setHover && setHover(0)}
        />
      );
    });

  if (loading) return <p>Đang tải feedback...</p>;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Đánh giá sản phẩm
      </h2>

      {/* Tạo feedback */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <textarea
          className="w-full border rounded-lg p-2 mb-2 resize-none"
          rows={3}
          placeholder="Viết đánh giá của bạn..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="flex gap-1 mb-3">
          {renderStars(newRating, setNewRating, hoverRating, setHoverRating)}
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Gửi đánh giá
        </button>
      </div>

      {/* Danh sách feedback */}
      {feedbacks.length === 0 ? (
        <p className="text-gray-500">Chưa có đánh giá nào</p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="bg-white p-4 rounded-lg shadow flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold">
                  <span>
                    {f.userId === currentUserId
                      ? "Bạn"
                      : f.userName || "Người dùng"}
                  </span>
                  <div className="flex gap-1">
                    {editingId === f.id
                      ? renderStars(
                        editingRating,
                        setEditingRating,
                        editingHover,
                        setEditingHover
                      )
                      : renderStars(f.rating)}
                  </div>
                </div>

                {(isAdmin || f.userId === currentUserId) && (
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() => {
                        setEditingId(f.id!);
                        setEditingContent(f.content);
                        setEditingRating(f.rating);
                        setEditingHover(0);
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(f.id!)}
                      className="text-red-500 hover:underline"
                    >
                      Xoá
                    </button>
                  </div>
                )}
              </div>

              {editingId === f.id ? (
                <>
                  <textarea
                    className="w-full border rounded-lg p-2 resize-none"
                    rows={2}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex gap-1">
                    {renderStars(
                      editingRating,
                      setEditingRating,
                      editingHover,
                      setEditingHover
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(f.id!)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 px-3 py-1 rounded"
                    >
                      Huỷ
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-700">{f.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}