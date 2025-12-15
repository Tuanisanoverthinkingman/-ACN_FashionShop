"use client";

import { useEffect, useState } from "react";
import {
    getAllPromotionsAdmin,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    Promotion,
    PromotionApplyType,
} from "@/services/promotion-services";

import { getAllCategories } from "@/services/category-services";
import { getAll } from "@/services/product-services";
import { getAllUsers } from "@/services/user-services";

import { toast } from "react-toastify";

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

    const [code, setCode] = useState("");
    const [desc, setDesc] = useState("");
    const [discount, setDiscount] = useState(0);
    const [applyType, setApplyType] = useState<PromotionApplyType>(
        PromotionApplyType.General
    );
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Danh sách để chọn khi ApplyType khác General
    const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    const fetchPromotions = async () => {
        setLoading(true);
        const res = await getAllPromotionsAdmin();
        if (res) setPromotions(res);
        setLoading(false);
    };

    const fetchOptions = async () => {
        const [prods, cats, usrs] = await Promise.all([getAll(), getAllCategories(), getAllUsers()]);
        setProducts(prods?.map(p => ({ id: p.id, name: p.name })) || []);
        setCategories(cats.map(c => ({ id: c.id, name: c.name })) || []);
        setUsers(usrs.map(u => ({ id: u.id, name: u.fullName })) || []);
    };

    useEffect(() => {
        fetchPromotions();
        fetchOptions();
    }, []);

    const resetForm = () => {
        setEditingPromo(null);
        setCode("");
        setDesc("");
        setDiscount(0);
        setApplyType(PromotionApplyType.General);
        setStartDate("");
        setEndDate("");
        setSelectedProducts([]);
        setSelectedCategories([]);
        setSelectedUsers([]);
    };

    const handleSubmit = async () => {
        if (!code || !startDate || !endDate) {
            toast.warn("Vui lòng điền đầy đủ thông tin");
            return;
        }

        const data = {
            code,
            description: desc,
            discountPercent: discount,
            applyType,
            startDate,
            endDate,
            ProductIds: selectedProducts,
            CategoryIds: selectedCategories,
            UserIds: selectedUsers,
        };

        try {
            if (editingPromo) {
                await updatePromotion(editingPromo.promotionId, data);
                toast.success("Cập nhật promotion thành công");
            } else {
                await createPromotion(data);
                toast.success("Tạo promotion thành công");
            }
            resetForm();
            fetchPromotions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi tạo/cập nhật promotion");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc muốn xóa promotion này?")) {
            await deletePromotion(id);
            fetchPromotions();
        }
    };

    const handleToggleStatus = async (id: number) => {
        await togglePromotionStatus(id);
        fetchPromotions();
    };

    const handleEdit = (promo: Promotion) => {
        setEditingPromo(promo);
        setCode(promo.code);
        setDesc(promo.description || "");
        setDiscount(promo.discountPercent);
        setApplyType(promo.applyType);
        setStartDate(promo.startDate.slice(0, 10));
        setEndDate(promo.endDate.slice(0, 10));

        setSelectedProducts(promo.productIds || []);
        setSelectedCategories(promo.categoryIds || []);
        setSelectedUsers(promo.userIds || []);
    };

    // Render checklist dựa theo ApplyType
    const renderSelectionList = () => {
        if (applyType === PromotionApplyType.Product) {
            return (
                <div className="flex flex-col max-h-40 overflow-auto border p-2">
                    {products.map(p => (
                        <label key={p.id}>
                            <input
                                type="checkbox"
                                value={p.id}
                                checked={selectedProducts.includes(p.id)}
                                onChange={e => {
                                    const id = parseInt(e.target.value);
                                    setSelectedProducts(prev =>
                                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                    );
                                }}
                            />{" "}
                            {p.name}
                        </label>
                    ))}
                </div>
            );
        } else if (applyType === PromotionApplyType.Category) {
            return (
                <div className="flex flex-col max-h-40 overflow-auto border p-2">
                    {categories.map(c => (
                        <label key={c.id}>
                            <input
                                type="checkbox"
                                value={c.id}
                                checked={selectedCategories.includes(c.id)}
                                onChange={e => {
                                    const id = parseInt(e.target.value);
                                    setSelectedCategories(prev =>
                                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                    );
                                }}
                            />{" "}
                            {c.name}
                        </label>
                    ))}
                </div>
            );
        } else if (applyType === PromotionApplyType.User) {
            return (
                <div className="flex flex-col max-h-40 overflow-auto border p-2">
                    {users.map(u => (
                        <label key={u.id}>
                            <input
                                type="checkbox"
                                value={u.id}
                                checked={selectedUsers.includes(u.id)}
                                onChange={e => {
                                    const id = parseInt(e.target.value);
                                    setSelectedUsers(prev =>
                                        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                                    );
                                }}
                            />{" "}
                            {u.name}
                        </label>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Quản lý Promotions</h1>

            {/* Form tạo / cập nhật */}
            <div className="mb-6 p-4 border rounded-md">
                <h2 className="font-semibold mb-2">
                    {editingPromo ? "Cập nhật Promotion" : "Tạo Promotion"}
                </h2>
                <div className="flex flex-col gap-2">
                    <input
                        className="border p-2"
                        placeholder="Code"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                    />
                    <input
                        className="border p-2"
                        placeholder="Description"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={0}
                            max={100}
                            className="border p-2"
                            placeholder="Discount (%)"
                            value={discount}
                            onChange={e => setDiscount(parseFloat(e.target.value))}
                        />
                        <span className="self-center">%</span>
                    </div>
                    <select
                        className="border p-2"
                        value={applyType}
                        onChange={e => setApplyType(Number(e.target.value))}
                    >
                        <option value={PromotionApplyType.General}>General</option>
                        <option value={PromotionApplyType.Product}>Product</option>
                        <option value={PromotionApplyType.Category}>Category</option>
                        <option value={PromotionApplyType.User}>User</option>
                    </select>

                    {/* Checklist chọn nhiều */}
                    {renderSelectionList()}

                    <div className="flex gap-2 mt-2">
                        <input
                            type="date"
                            className="border p-2"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border p-2"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={handleSubmit}
                        >
                            {editingPromo ? "Cập nhật" : "Tạo mới"}
                        </button>
                        {editingPromo && (
                            <button
                                className="bg-gray-400 text-white px-4 py-2 rounded"
                                onClick={resetForm}
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List Promotion */}
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <table className="w-full border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">Code</th>
                            <th className="border p-2">Discount</th>
                            <th className="border p-2">ApplyType</th>
                            <th className="border p-2">StartDate</th>
                            <th className="border p-2">EndDate</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(promo => (
                            <tr key={promo.promotionId}>
                                <td className="border p-2">{promo.code}</td>
                                <td className="border p-2">{promo.discountPercent}%</td>
                                <td className="border p-2">{PromotionApplyType[promo.applyType]}</td>
                                <td className="border p-2">{promo.startDate.slice(0, 10)}</td>
                                <td className="border p-2">{promo.endDate.slice(0, 10)}</td>
                                <td className="border p-2">{promo.status === 0 ? "Active" : "Expired"}</td>
                                <td className="border p-2 flex gap-2">
                                    <button
                                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                                        onClick={() => handleEdit(promo)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                        onClick={() => handleDelete(promo.promotionId)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="bg-green-500 text-white px-2 py-1 rounded"
                                        onClick={() => handleToggleStatus(promo.promotionId)}
                                    >
                                        Toggle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
