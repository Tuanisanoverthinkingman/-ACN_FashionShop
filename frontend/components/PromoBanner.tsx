"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllPromotionsForUser, getGeneralPromotions, claimPromotion, UserPromotion } from "@/services/user-promo-services";

export default function PromoList() {
  const [promos, setPromos] = useState<UserPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  // ===============================
  // Fetch promotions
  // ===============================
  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        let allPromos: UserPromotion[] = [];
        const token = localStorage.getItem("token");

        if (token) {
          allPromos = await getAllPromotionsForUser();
        } else {
          allPromos = await getGeneralPromotions();
        }
        console.log(allPromos);

        setPromos(allPromos || []);
      } catch {
        toast.error("Không thể tải danh sách khuyến mãi");
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();

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
      // cập nhật trạng thái đã nhận
      setPromos(prev =>
        prev.map(p =>
          p.promotionId === promotionId ? { ...p, isUsed: true } : p
        )
      );
    } catch (err) {
      // toast đã show trong claimPromotion
    } finally {
      setClaimingId(null);
    }
  };

  // ===============================
  // Render
  // ===============================
  if (loading)
    return <p className="text-center py-4">Đang tải khuyến mãi...</p>;

  if (promos.length === 0)
    return <p className="text-center py-4 text-gray-500">Không có mã giảm giá nào 😢</p>;

  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {promos.map(promo => (
        <div
          key={promo.promotionId}
          className="flex-shrink-0 w-72 border rounded-lg p-4 shadow hover:shadow-lg transition flex flex-col justify-between bg-white"
        >
          <div>
            <h3 className="font-bold text-lg mb-2">{promo.code}</h3>
            {promo.description && <p className="text-sm text-gray-700 mb-2">{promo.description}</p>}
            <p className="text-sm mb-2">
              Giảm <span className="font-semibold text-green-600">{promo.discountPercent}%</span>
            </p>
          </div>

          {promo.isUsed ? (
            <button className="w-full py-2 rounded bg-gray-400 text-white font-semibold cursor-not-allowed">
              Đã nhận
            </button>
          ) : (
            <button
              disabled={claimingId === promo.promotionId}
              onClick={() => handleClaim(promo.promotionId)}
              className="w-full py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {claimingId === promo.promotionId ? "Đang nhận..." : "Nhận mã"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
