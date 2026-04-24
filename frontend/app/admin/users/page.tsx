"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Space, Input, Tag, Card } from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { getAllUsers, updateIsActive, User } from "@/services/user-services";
import { toast } from "react-toastify";

const { Search } = Input;

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (user.phone && user.phone.includes(searchText))
    );

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            if (data) setUsers(data.reverse());
        } catch (err: any) {
            toast.error("Lấy danh sách người dùng thất bại!");
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
            toast.success(res.message || "Cập nhật thành công");
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Cập nhật trạng thái thất bại");
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            sorter: (a: User, b: User) => a.id - b.id,
        },
        {
            title: "Người dùng",
            key: "userInfo",
            render: (_: any, record: User) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{record.fullName}</span>
                    <span className="text-xs text-slate-400">@{record.username}</span>
                </div>
            )
        },
        {
            title: "Liên hệ",
            key: "contact",
            render: (_: any, record: User) => (
                <div className="text-sm">
                    <p className="mb-0 italic">{record.email}</p>
                    <p className="mb-0 text-slate-500">{record.phone || "---"}</p>
                </div>
            )
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            render: (role: string) => (
                <Tag color={role === "Admin" ? "volcano" : "blue"} className="font-medium">
                    {role.toUpperCase()}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            key: "status",
            render: (_: any, record: User) => (
                <Tag color={record.isActive ? "green" : "red"}>
                    {record.isActive ? "Đang hoạt động" : "Bị khóa"}
                </Tag>
            ),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 150,
            render: (_: any, record: User) => (
                <Button
                    type={record.isActive ? "dashed" : "primary"}
                    danger={record.isActive}
                    size="small"
                    className="font-medium"
                    onClick={() => handleToggleActive(record.id)}
                >
                    {record.isActive ? "Khóa tài khoản" : "Kích hoạt lại"}
                </Button>
            ),
        },
    ];

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <UserOutlined /> Quản lý người dùng
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Danh sách tất cả thành viên trong hệ thống của bạn</p>
                    </div>

                    <Search
                        placeholder="Tìm theo tên"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        className="max-w-md"
                        onSearch={(value) => setSearchText(value)}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                <Table
                    rowKey="id"
                    dataSource={filteredUsers}
                    columns={columns}
                    loading={loading}
                    bordered={false}
                    className="custom-table"
                    pagination={{
                        pageSize: 8,
                        showTotal: (total) => `Tổng số ${total} người dùng`,
                    }}
                />
            </Card>

            <style jsx global>{`
                .custom-table .ant-table-thead > tr > th {
                    background-color: #f8fafc;
                    font-weight: 600;
                    color: #475569;
                }
            `}</style>
        </div>
    );
}