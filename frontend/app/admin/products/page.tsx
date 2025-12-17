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
import type { UploadFile } from "antd/es/upload/interface";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [removeImage, setRemoveImage] = useState(false);
  const [excelFileList, setExcelFileList] = useState<UploadFile[]>([]);

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
    setRemoveImage(false);

    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      instock: product.instock,
      categoryId: product.categoryId,
    });

    if (product.imageUrl) {
      setImageFileList([
        {
          uid: "-1",
          name: "current-image.jpg",
          status: "done",
          url: product.imageUrl,
        },
      ]);
    } else {
      setImageFileList([]);
    }

    setImageFile(null);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setRemoveImage(false);

    form.resetFields();

    // THÊM: hiển thị no_image
    setImageFileList([
      {
        uid: "-1",
        name: "no_image.png",
        status: "done",
        url: "/no_image.png",
      },
    ]);

    setImageFile(null);
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      let imageUrl: string | null = editingProduct?.imageUrl ?? null;

      // THÊM SẢN PHẨM → mặc định null
      if (!editingProduct) {
        imageUrl = null;
      }

      if (removeImage) {
        imageUrl = null; // XOÁ ẢNH
      }

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
      setImageFileList([]);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) return;
    await uploadExcelSheets(excelFile);
    setExcelFile(null);
    setExcelFileList([]);
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
      render: (_: any, record: Product) => (
        <img
          src={record.imageUrl || "/no_image.png"}
          alt="product"
          style={{ width: 60, objectFit: "cover" }}
        />
      ),
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
          accept=".xlsx"
          maxCount={1}
          fileList={excelFileList}
          beforeUpload={() => false}
          onChange={({ fileList }) => {
            setExcelFileList(fileList);
            setExcelFile(fileList[0]?.originFileObj || null);
          }}
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
              fileList={imageFileList}
              maxCount={1}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                setImageFileList(fileList);

                if (fileList.length === 0) {
                  // user xoá ảnh
                  setImageFile(null);
                  setRemoveImage(true);
                } else {
                  setImageFile(fileList[0].originFileObj || null);
                  setRemoveImage(false);
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
