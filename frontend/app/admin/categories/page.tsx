"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, Card, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined } from "@ant-design/icons";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
  CategoryData,
} from "@/services/category-services";
import { toast } from "react-toastify";

const { Title } = Typography;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCategory(id);
          toast.success("Đã xóa danh mục thành công");
          fetchCategories();
        } catch (error) {
          toast.error("Xóa danh mục thất bại");
        }
      },
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const data: CategoryData = {
        name: values.name,
        description: values.description,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(data);
        toast.success("Thêm danh mục mới thành công");
      }

      setModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns = [
    { 
      title: "ID", 
      dataIndex: "id", 
      key: "id", 
      width: 80,
      align: 'center' as const 
    },
    { 
      title: "Tên danh mục", 
      dataIndex: "name", 
      key: "name",
      render: (text: string) => <span className="font-semibold text-slate-700">{text}</span>
    },
    { 
      title: "Mô tả", 
      dataIndex: "description", 
      key: "description",
      render: (text: string) => <span className="text-slate-500">{text || "---"}</span>
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      align: 'center' as const,
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-50"
          >
            Sửa
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            className="hover:bg-red-50"
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={3} className="!mb-0 flex items-center gap-2">
              <FolderOpenOutlined className="text-blue-500" /> Quản lý danh mục
            </Title>
            <p className="text-slate-500 text-sm mt-1">Quản lý các loại sản phẩm đang kinh doanh</p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            size="large"
            className="rounded-lg shadow-md bg-blue-600"
          >
            Thêm danh mục
          </Button>
        </div>

        <Table
          rowKey="id"
          dataSource={categories}
          columns={columns}
          loading={loading}
          bordered={false}
          className="custom-table"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        okText="Hoàn tất"
        cancelText="Hủy"
        centered
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label={<span className="font-medium text-slate-600">Tên danh mục</span>}
            name="name"
            rules={[{ required: true, message: "Vui lòng không để trống tên danh mục" }]}
          >
            <Input placeholder="Ví dụ: Áo thun, Quần Jean..." className="rounded-lg p-2" />
          </Form.Item>
          <Form.Item 
            label={<span className="font-medium text-slate-600">Mô tả chi tiết</span>} 
            name="description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Nhập mô tả ngắn gọn về danh mục này..." 
              className="rounded-lg p-2"
            />
          </Form.Item>
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