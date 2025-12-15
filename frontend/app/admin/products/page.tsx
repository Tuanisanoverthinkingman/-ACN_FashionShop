"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import {
  getAll,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  ProductRequest,
  uploadExcelSheets,
} from "@/services/product-services";
import { getAllCategories, Category } from "@/services/category-services";
import { uploadImage } from "@/services/file-services";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAll();
      if (data) setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    await deleteProduct(id);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      instock: product.instock,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      let imageUrl = values.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const data: ProductRequest = {
        name: values.name,
        description: values.description,
        price: values.price,
        instock: values.instock,
        categoryId: values.categoryId,
        imageUrl,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }

      setModalOpen(false);
      setImageFile(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) return;
    await uploadExcelSheets(excelFile);
    setExcelFile(null);
    fetchProducts();
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "Giá", dataIndex: "price", key: "price" },
    { title: "Tồn kho", dataIndex: "instock", key: "instock" },
    {
      title: "Danh mục",
      key: "category",
      render: (_: any, record: Product) => record.category?.name || "",
    },
    {
      title: "Ảnh",
      key: "image",
      render: (_: any, record: Product) =>
        record.imageUrl ? (
          <img src={record.imageUrl} alt="" style={{ width: 60 }} />
        ) : null,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Quản lý sản phẩm</h1>

      <Space className="mb-4">
        <Button type="primary" onClick={handleAdd}>
          Thêm sản phẩm
        </Button>

        <Upload
          beforeUpload={(file) => {
            setExcelFile(file);
            return false;
          }}
          accept=".xlsx,.xls"
          showUploadList={{ showRemoveIcon: true }}
        >
          <Button icon={<UploadOutlined />}>Upload Excel</Button>
        </Upload>

        <Button
          type="primary"
          onClick={handleUploadExcel}
          disabled={!excelFile}
        >
          Xử lý Excel
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={products}
        columns={columns}
        loading={loading}
        bordered
      />

      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên sản phẩm"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="Giá"
            name="price"
            rules={[{ required: true, message: "Nhập giá sản phẩm" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Tồn kho"
            name="instock"
            rules={[{ required: true, message: "Nhập tồn kho" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Danh mục"
            name="categoryId"
            rules={[{ required: true, message: "Chọn danh mục" }]}
          >
            <Select
              options={categories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </Form.Item>
          <Form.Item label="Ảnh sản phẩm">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              showUploadList={{ showRemoveIcon: true }}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
