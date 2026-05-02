"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Input, Tag, Card, Modal, Form, Select } from "antd";
import { UserOutlined, SearchOutlined, PlusOutlined, EditOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { getAllUsers, updateIsActive, createUser, updateUser, User } from "@/services/user-services";
import { toast } from "react-toastify";

const { Search } = Input;
const { Option } = Select;

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();

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

    const openAddModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ role: "User" });
        setIsModalOpen(true);
    };

    const openEditModal = (record: User) => {
        setEditingUser(record);
        form.setFieldsValue({
            username: record.username,
            fullName: record.fullName,
            email: record.email,
            phone: record.phone,
            role: record.role,
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (values: any) => {
        setSubmitLoading(true);
        try {
            if (editingUser) {
                await updateUser(editingUser.id, values);
                toast.success("Cập nhật thông tin thành công!");
            } else {
                await createUser(values);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setSubmitLoading(false);
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
                    <p className="mb-0 italic text-blue-600">{record.email}</p>
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
                    {role?.toUpperCase() || "USER"}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: 'statusText',
            key: "status",
            render: (text: string) => (
                <Tag color={
                    text === "Đang hoạt động" ? "green"
                        : text === "Chờ xác thực" ? "orange"
                            : "red"
                }>
                    {text}
                </Tag>
            )
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 220,
            render: (_: any, record: User) => (
                <div className="flex gap-2">
                    <Button 
                        type="primary" 
                        ghost 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => openEditModal(record)}
                    >
                        Sửa
                    </Button>
                    <Button
                        type={record.isActive ? "dashed" : "primary"}
                        danger={record.isActive}
                        size="small"
                        icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                        className="font-medium min-w-[90px]"
                        onClick={() => handleToggleActive(record.id)}
                    >
                        {record.isActive ? "Khóa" : "Mở khóa"}
                    </Button>
                </div>
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

                    <div className="flex gap-3 w-full md:w-auto">
                        <Search
                            placeholder="Tìm theo tên hoặc email"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            className="max-w-md"
                            onSearch={(value) => setSearchText(value)}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlusOutlined />} 
                            onClick={openAddModal}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Thêm mới
                        </Button>
                    </div>
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

            {/* MODAL THÊM / SỬA NGƯỜI DÙNG */}
            <Modal
                title={
                    <div className="text-lg font-bold text-slate-800">
                        {editingUser ? "Cập nhật thông tin người dùng" : "Thêm người dùng mới"}
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnHidden 
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    className="mt-6"
                >
                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
                    >
                        <Input disabled={!!editingUser} placeholder="Tên đăng nhập" size="large" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu!" }, 
                                { min: 6, message: "Mật khẩu ít nhất 6 ký tự!" }
                            ]}
                        >
                            <Input.Password placeholder="Mật khẩu" size="large" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
                    >
                        <Input placeholder="Họ và tên" size="large" />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email!" },
                                { type: "email", message: "Email không hợp lệ!" }
                            ]}
                        >
                            {/* Email giờ đã được phép chỉnh sửa */}
                            <Input placeholder="email@gmail.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                        >
                            <Input placeholder="0987654321" size="large" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
                    >
                        <Select size="large" disabled={!!editingUser && editingUser.role === "Admin"}>
                            <Option value="User">Người dùng</Option>
                            <Option value="Admin">Quản trị viên</Option>
                        </Select>
                    </Form.Item>

                    <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                        <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button size="large" type="primary" htmlType="submit" loading={submitLoading} className="bg-blue-600">
                            {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                        </Button>
                    </div>
                </Form>
            </Modal>

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