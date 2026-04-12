"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Space } from "antd";
import { getAllUsers, updateIsActive, User } from "@/services/user-services";
import { toast } from "react-toastify";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchText.toLowerCase())
    );

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            if (data) setUsers(data.reverse());
        } catch (err: any) {
            toast.error("Lấy danh sách user thất bại!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleActive = async (id: number) => {
        try {
            const res = await updateIsActive(id);
            toast.success(res.message);
            fetchUsers();
        } catch (Err: any) {
            toast.error(Err.response?.data?.message || "Cập nhật trạng thái thất bại");
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Họ tên", dataIndex: "fullName", key: "fullName" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Điện thoại", dataIndex: "phone", key: "phone" },
        { title: "Vai trò", dataIndex: "role", key: "role" },
        {
            title: "Trạng thái",
            key: "status",
            render: (_: any, record: User) => (
                <span className={record.isActive ? "text-green-600" : "text-red-600"}>
                    {record.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            title: "Hành động",
            key: "actions",
            render: (_: any, record: User) => (
                <Space>
                    <Button
                        type={record.isActive ? "default" : "primary"}
                        danger={record.isActive}
                        size="small"
                        onClick={() => handleToggleActive(record.id)}
                    >
                        {record.isActive ? "Tạm xóa" : "Kích hoạt"}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Quản lý người dùng</h1>
            <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="border rounded px-2 py-1 mb-4 w-full"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
            <Table
                rowKey="id"
                dataSource={filteredUsers}
                columns={columns}
                loading={loading}
                bordered
            />
        </div>
    );
}