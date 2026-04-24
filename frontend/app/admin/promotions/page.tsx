"use client";

import { useEffect, useState, useMemo } from "react";
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
import { FiSearch, FiEdit, FiTrash2, FiPower } from "react-icons/fi";

const applyTypeNames: Record<number, string> = {
    [PromotionApplyType.General]: "Tất cả đơn hàng",
    [PromotionApplyType.Product]: "Sản phẩm",
    [PromotionApplyType.Category]: "Danh mục",
    [PromotionApplyType.User]: "Người dùng",
};

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

    const [code, setCode] = useState("");
    const [desc, setDesc] = useState("");
    const [discount, setDiscount] = useState(0);
    const [applyType, setApplyType] = useState<PromotionApplyType>(PromotionApplyType.General);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    // State hỗ trợ tìm kiếm trong form chọn
    const [searchQuery, setSearchQuery] = useState("");

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
        setSearchQuery("");
    };

    const handleSubmit = async () => {
        if (!code || !startDate || !endDate) {
            toast.warn("Vui lòng điền đầy đủ mã và thời gian");
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
                toast.success("Cập nhật thành công ✨");
            } else {
                await createPromotion(data);
                toast.success("Tạo mã mới thành công ✨");
            }
            resetForm();
            fetchPromotions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi xử lý");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Bạn có chắc muốn xóa mã này vĩnh viễn?")) {
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
        setSearchQuery("");
    };

    // --- Component Searchable List ---
    const SearchableList = ({ items, selected, setSelected }: any) => {
        const filtered = useMemo(() => {
            return items.filter((i: any) => i.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }, [items, searchQuery]);

        return (
            <div className="flex flex-col border border-sky-100 rounded-xl overflow-hidden bg-white shadow-sm mt-3">
                <div className="p-2 border-b border-sky-50 bg-sky-50/30 flex items-center gap-2">
                    <FiSearch className="text-sky-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm p-1 text-gray-700"
                    />
                </div>
                <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-sky-200">
                    {filtered.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-4">Không tìm thấy kết quả</p>
                    ) : (
                        filtered.map((item: any) => (
                            <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-sky-50/50 rounded-lg cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    value={item.id}
                                    checked={selected.includes(item.id)}
                                    onChange={e => {
                                        const id = parseInt(e.target.value);
                                        setSelected((prev: number[]) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                    }}
                                    className="w-4 h-4 text-sky-500 rounded focus:ring-sky-400"
                                />
                                <span className="text-sm text-gray-700 line-clamp-1">{item.name}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-['Poppins']">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* --- FORM PANEL (TRÁI) --- */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-sky-400 rounded-full inline-block"></span>
                            {editingPromo ? "Cập nhật mã giảm giá" : "Tạo mã mới"}
                        </h2>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Mã Code</label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all text-sm uppercase"
                                    placeholder="VD: SUMMER2026"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Mô tả chương trình</label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all text-sm"
                                    placeholder="Chi tiết khuyến mãi..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Giảm giá (%)</label>
                                    <input
                                        type="number" min={0} max={100}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all text-sm"
                                        value={discount}
                                        onChange={e => setDiscount(parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Phạm vi áp dụng</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all text-sm bg-white"
                                        value={applyType}
                                        onChange={e => { setApplyType(Number(e.target.value)); setSearchQuery(""); }}
                                    >
                                        <option value={PromotionApplyType.General}>Tất cả đơn hàng</option>
                                        <option value={PromotionApplyType.Product}>Sản phẩm cụ thể</option>
                                        <option value={PromotionApplyType.Category}>Danh mục cụ thể</option>
                                        <option value={PromotionApplyType.User}>Người dùng cụ thể</option>
                                    </select>
                                </div>
                            </div>

                            {/* Khu vực chọn đối tượng */}
                            {applyType === PromotionApplyType.Product && <SearchableList items={products} selected={selectedProducts} setSelected={setSelectedProducts} />}
                            {applyType === PromotionApplyType.Category && <SearchableList items={categories} selected={selectedCategories} setSelected={setSelectedCategories} />}
                            {applyType === PromotionApplyType.User && <SearchableList items={users} selected={selectedUsers} setSelected={setSelectedUsers} />}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Từ ngày</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 text-sm text-gray-600"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Đến ngày</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 text-sm text-gray-600"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm shadow-sky-200"
                                    onClick={handleSubmit}
                                >
                                    {editingPromo ? "Lưu thay đổi" : "Khởi tạo mã"}
                                </button>
                                {editingPromo && (
                                    <button
                                        className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-all"
                                        onClick={resetForm}
                                    >
                                        Hủy
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- LIST PANEL (PHẢI) --- */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-white rounded-2xl shadow-sm border border-sky-50 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">Danh sách mã giảm giá</h2>
                        </div>

                        {loading ? (
                            <div className="p-10 text-center text-sky-500 animate-pulse">Đang tải dữ liệu...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-sky-50/50 text-xs text-sky-800 uppercase tracking-wider">
                                            <th className="p-4 font-semibold">Mã</th>
                                            <th className="p-4 font-semibold">Mức giảm</th>
                                            <th className="p-4 font-semibold">Phạm vi</th>
                                            <th className="p-4 font-semibold">Thời gian</th>
                                            <th className="p-4 font-semibold">Trạng thái</th>
                                            <th className="p-4 font-semibold text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-gray-50">
                                        {promotions.map(promo => (
                                            <tr key={promo.promotionId} className="hover:bg-sky-50/30 transition-colors">
                                                <td className="p-4 font-bold text-gray-800">{promo.code}</td>
                                                <td className="p-4 font-semibold text-red-500">-{promo.discountPercent}%</td>
                                                <td className="p-4 text-gray-600">
                                                    <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1.5 rounded-md text-xs font-semibold">
                                                        {applyTypeNames[promo.applyType]}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs">
                                                    {promo.startDate.slice(0, 10)} <br /> <span className="text-gray-300">đến</span> <br /> {promo.endDate.slice(0, 10)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${promo.status === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {promo.status === 0 ? "Đang chạy" : "Đã dừng"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleToggleStatus(promo.promotionId)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Bật/Tắt">
                                                            <FiPower size={16} />
                                                        </button>
                                                        <button onClick={() => handleEdit(promo)} className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors" title="Chỉnh sửa">
                                                            <FiEdit size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(promo.promotionId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {promotions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">Chưa có mã giảm giá nào được tạo.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}