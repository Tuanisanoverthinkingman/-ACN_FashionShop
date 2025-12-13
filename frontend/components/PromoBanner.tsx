"use client";

import React, { useEffect, useState } from "react";
import { getActivePromotions, Promotion } from "@/services/promotion-services";
import { claimPromotion } from "@/services/user-promo-services";
import { toast } from "react-toastify";

export default function PromoList() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  // ===============================
  // Fetch promotions có thể claim
  // ===============================
  const fetchPromos = async () => {
    setLoading(true);
    try {
      const data = await getActivePromotions();
      setPromos(data);
    } catch {
      toast.error("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();

    // Refresh khi login / logout
    const handler = () => fetchPromos();
    window.addEventListener("userChanged", handler);

    return () => window.removeEventListener("userChanged", handler);
  }, []);

  // ===============================
  // Claim promotion
  // ===============================
  const handleClaim = async (promotionId: number) => {
    setClaimingId(promotionId);
    try {
      await claimPromotion(promotionId);

      toast.success("Nhận mã thành công 🎉");
      setPromos((prev) =>
        prev.filter((p) => p.promotionId !== promotionId)
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Nhận mã thất bại");
    } finally {
      setClaimingId(null);
    }
  };

  // ===============================
  // Render
  // ===============================
  if (loading)
    return (
      <p className="text-center py-4">
        Đang tải khuyến mãi...
      </p>
    );

  if (promos.length === 0)
    return (
      <p className="text-center py-4 text-gray-500">
        Không có mã giảm giá nào 😢
      </p>
    );

  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {promos.map((promo) => (
        <div
          key={promo.promotionId}
          className="flex-shrink-0 w-72 border rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col justify-between bg-white"
        >
          <div>
            <h3 className="font-bold text-lg mb-2">{promo.code}</h3>

            {promo.description && (
              <p className="text-sm text-gray-700 mb-2">{promo.description}</p>
            )}

            <p className="text-sm mb-2">
              Giảm{" "}
              <span className="font-semibold text-green-600">
                {promo.discountPercent}%
              </span>
            </p>

            {promo.ProductNames?.length ? (
              <p className="text-sm text-gray-500 mb-2">
                Áp dụng cho sản phẩm: {promo.ProductNames.join(", ")}
              </p>
            ) : null}

            {promo.CategoryNames?.length ? (
              <p className="text-sm text-gray-500 mb-2">
                Áp dụng cho danh mục: {promo.CategoryNames.join(", ")}
              </p>
            ) : null}

            <p className="text-xs text-gray-500 mb-4">
              {new Date(promo.startDate).toLocaleDateString()} –{" "}
              {new Date(promo.endDate).toLocaleDateString()}
            </p>
          </div>

          <button
            disabled={claimingId === promo.promotionId}
            onClick={() => handleClaim(promo.promotionId)}
            className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50"
          >
            {claimingId === promo.promotionId ? "Đang nhận..." : "Nhận mã"}
          </button>
        </div>
      ))}
    </div>
  );
}
