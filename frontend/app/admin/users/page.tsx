"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Space } from "antd";
import { getAllUsers, updateIsActive } from "@/services/user-services";
import { toast } from "react-toastify";

interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            if (data) setUsers(data);
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
        { title: "Full Name", dataIndex: "fullName", key: "fullName" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Phone", dataIndex: "phone", key: "phone" },
        { title: "Role", dataIndex: "role", key: "role" },
        {
            title: "Status",
            key: "status",
            render: (_: any, record: User) => (
                <span className={record.isActive ? "text-green-600" : "text-red-600"}>
                    {record.isActive ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            title: "Actions",
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
            <h1 className="text-2xl font-bold mb-4">Users Management</h1>
            <Table
                rowKey="id"
                dataSource={users}
                columns={columns}
                loading={loading}
                bordered
            />
        </div>
    );
}