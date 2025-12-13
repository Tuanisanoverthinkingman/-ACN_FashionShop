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

export default function Feedback({ productId, currentUserId, isAdmin }: FeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);

  const [newContent, setNewContent] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingRating, setEditingRating] = useState(0);
  const [editingHover, setEditingHover] = useState(0);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await getFeedbackByProduct(productId);
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [productId]);

  const handleCreate = async () => {
    if (!newContent || newRating < 1 || newRating > 5) {
      toast.error("Nội dung và đánh giá hợp lệ từ 1-5");
      return;
    }
    try {
      const data: FeedbackData = { productId, content: newContent, rating: newRating };
      await createFeedback(data);
      setNewContent("");
      setNewRating(0);
      setHoverRating(0);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingContent || editingRating < 1 || editingRating > 5) {
      toast.error("Nội dung và đánh giá hợp lệ từ 1-5");
      return;
    }
    try {
      const data: FeedbackData = { productId, content: editingContent, rating: editingRating };
      await updateFeedback(id, data);
      setEditingId(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá feedback này?")) return;
    try {
      await deleteFeedback(id);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  // Render stars với hover và rating dùng FaStar
  const renderStars = (
    rating: number,
    setRating?: (i: number) => void,
    hover?: number,
    setHover?: (i: number) => void
  ) =>
    Array.from({ length: 5 }).map((_, i) => {
      const isHovering = hover !== undefined && hover > 0;
      const filled = isHovering ? i < hover! : i < rating;
      const isInteractive = !!setRating;
      return (
        <FaStar
          key={i}
          className={`cursor-pointer transition-colors ${filled ? "text-yellow-400" : "text-gray-300"}`}
          size={24}
          onClick={() => setRating && setRating(i + 1)}
          onMouseEnter={() => setHover && setHover(i + 1)}
          onMouseLeave={() => setHover && setHover(0)}
        />
      );
    });

  if (loading) return <p>Đang tải feedback...</p>;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Đánh giá sản phẩm</h2>

      {/* Form tạo feedback mới */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 mb-2 resize-none"
          rows={3}
          placeholder="Viết đánh giá của bạn..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="flex items-center gap-2 mb-2">
          {renderStars(newRating, setNewRating, hoverRating, setHoverRating)}
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-400 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold"
        >
          Gửi đánh giá
        </button>
      </div>

      {/* Danh sách feedback */}
      {feedbacks.length === 0 ? (
        <p className="text-gray-500">Chưa có đánh giá nào 😢</p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-800">
                  {f.userId === currentUserId ? "Bạn" : `User #${f.userId}`} -{" "}
                  {editingId === f.id
                    ? renderStars(editingRating, setEditingRating, editingHover, setEditingHover)
                    : renderStars(f.rating)}
                </p>
                {(isAdmin || f.userId === currentUserId) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(f.id!);
                        setEditingContent(f.content);
                        setEditingRating(f.rating);
                        setEditingHover(0);
                      }}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(f.id!)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Xoá
                    </button>
                  </div>
                )}
              </div>

              {editingId === f.id && (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 resize-none"
                    rows={2}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(editingRating, setEditingRating, editingHover, setEditingHover)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(f.id!)}
                      className="bg-green-400 hover:bg-green-500 text-white py-1 px-3 rounded-lg"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {editingId !== f.id && <p className="text-gray-700">{f.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
