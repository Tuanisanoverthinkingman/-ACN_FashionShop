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
  Divider,
} from "antd";
import { UploadOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getAllForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  Product,
  uploadExcelSheets,
} from "@/services/product-services";
import { getAllCategories, Category } from "@/services/category-services";
import { uploadImage } from "@/services/file-services";
import type { UploadFile } from "antd/es/upload/interface";
import { toast } from "react-toastify";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // States cho Ảnh và Excel
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [removeImage, setRemoveImage] = useState(false);
  const [excelFileList, setExcelFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllForAdmin();
      if (data) setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreProduct(id);
      fetchProducts();
    } catch (error) {
      console.error("Lỗi khi khôi phục sản phẩm:", error);
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
      categoryId: product.categoryId,
      productVariants: product.productVariants?.map(v => ({
        ...v,
        color: v.color || "Mặc định"
      })) || [{ size: "", color: "Mặc định", costPrice: 0, price: 0, instock: 0 }],
    });

    if (product.imageUrl) {
      setImageFileList([{ uid: "-1", name: "img", status: "done", url: product.imageUrl }]);
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
    form.setFieldsValue({
      productVariants: [{ size: "", color: "Mặc định", costPrice: 0, price: 0, instock: 0 }]
    });
    setImageFileList([]);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      let imageUrl: string | null = editingProduct?.imageUrl ?? null;

      if (removeImage) imageUrl = null;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const data = {
        ...values,
        imageUrl,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Cập nhật thành công!");
      } else {
        await createProduct(data);
        toast.success("Thêm mới thành công!");
      }

      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  // --- CẬP NHẬT LOGIC IMPORT EXCEL --
  const handleExcelUpload = async (file: File) => {
    try {
      setLoading(true);
      await uploadExcelSheets(file);
      toast.success("Import Excel thành công!");
      fetchProducts();
    } catch (error) {
      toast.error("Lỗi khi import Excel");
      console.error(error);
    } finally {
      setExcelFileList([]);
      setLoading(false);
    }
    return false;
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Ảnh",
      key: "image",
      width: 80,
      render: (_: any, record: Product) => (
        <img src={record.imageUrl || "/no_image.png"} alt="product" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }} />
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
    {
      title: "Giá bán",
      key: "priceRange",
      render: (_: any, record: Product) => {
        const prices = record.productVariants?.map(v => v.price) || [];
        if (prices.length === 0) return "Chưa có giá";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `${min.toLocaleString()}đ` : `${min.toLocaleString()} - ${max.toLocaleString()}đ`;
      }
    },
    {
      title: "Tổng kho",
      key: "totalInstock",
      render: (_: any, record: Product) => {
        const total = record.productVariants?.reduce((sum, v) => sum + v.instock, 0) || 0;
        return <span style={{ fontWeight: 'bold' }}>{total}</span>;
      }
    },
    {
      title: "Trạng thái",
      key: "status",
      filters: [
        { text: 'Đang bán', value: false },
        { text: 'Ngưng bán', value: true },
      ],
      onFilter: (value: any, record: Product) => record.isDeleted === value,
      render: (_: any, record: Product) => (
        record.isDeleted ? (
          <span className="inline-block min-w-[80px] text-center text-red-500 bg-red-900/30 border border-red-500 px-2 py-1 rounded text-xs">
            Ngưng bán
          </span>
        ) : (
          <span className="inline-block min-w-[80px] text-center text-green-500 bg-green-900/30 border border-green-500 px-2 py-1 rounded text-xs">
            Đang bán
          </span>
        )
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_: any, record: Product) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          {record.isDeleted ? (
            <Button
              size="small"
              style={{ backgroundColor: '#52c41a', color: 'white', border: 'none' }}
              onClick={() => handleRestore(record.id)}
            >
              Khôi phục
            </Button>
          ) : (
            <Button type="primary" danger size="small" onClick={() => handleDelete(record.id)}>
              Xoá
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1 className="text-2xl font-bold mb-4">Quản lý sản phẩm</h1>

      <Space className="mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm sản phẩm</Button>
        <Upload
          accept=".xlsx"
          maxCount={1}
          fileList={excelFileList}
          beforeUpload={handleExcelUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Import Excel</Button>
        </Upload>
      </Space>

      <Table rowKey="id" dataSource={products} columns={columns} loading={loading} bordered />

      <Modal
        title={editingProduct ? "Cập nhật sản phẩm" : "Thêm mới"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Cột trái: Ảnh */}
            <div style={{ width: 150 }}>
              <Form.Item label="Hình ảnh">
                <Upload
                  listType="picture-card"
                  fileList={imageFileList}
                  beforeUpload={(file) => {
                    setImageFile(file);
                    setImageFileList([file as any]);
                    setRemoveImage(false);
                    return false; // Ngăn auto upload
                  }}
                  onRemove={() => {
                    setImageFile(null);
                    setImageFileList([]);
                    setRemoveImage(true);
                  }}
                >
                  {imageFileList.length >= 1 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>Tải ảnh</div></div>}
                </Upload>
              </Form.Item>
            </div>

            <div style={{ flex: 1 }}>
              <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>

              <Form.Item label="Danh mục" name="categoryId" rules={[{ required: true }]}>
                <Select options={categories.map((c) => ({ label: c.name, value: c.id }))} />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Nhập mô tả sản phẩm..." />
          </Form.Item>

          <Divider orientation={"left" as any} plain>Biến thể sản phẩm</Divider>

          <div style={{ display: 'flex', marginBottom: 8, fontWeight: 'bold' }}>
            <div style={{ width: 120, marginRight: 8 }}>Kích cỡ</div>
            <div style={{ width: 120, marginRight: 8 }}>Màu sắc</div>
            <div style={{ width: 160, marginRight: 8 }}>Giá nhập</div>
            <div style={{ width: 160, marginRight: 8 }}>Giá bán</div>
            <div style={{ width: 100, marginRight: 8 }}>Tồn kho</div>
          </div>

          <Form.List name="productVariants">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">

                    <Form.Item {...restField} name={[name, "size"]} rules={[{ required: true }]}>
                      <Input placeholder="Size" style={{ width: 100 }} />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "color"]} rules={[{ required: true }]}>
                      <Input placeholder="Màu sắc" style={{ width: 120 }} />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "costPrice"]} rules={[{ required: true }]}>
                      <InputNumber
                        min={0 as number}
                        style={{ width: 160 }}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v ? Number(v.replace(/\$\s?|(,*)/g, '')) : 0}
                        placeholder="VNĐ"
                      />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "price"]} rules={[{ required: true }]}>
                      <InputNumber
                        min={0 as number}
                        style={{ width: 160 }}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v ? Number(v.replace(/\$\s?|(,*)/g, '')) : 0}
                        placeholder="VNĐ"
                      />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "instock"]} rules={[{ required: true }]}>
                      <InputNumber min={0} style={{ width: 100 }} />
                    </Form.Item>

                    {fields.length > 1 && <Button type="text" danger onClick={() => remove(name)} icon={<DeleteOutlined />} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ color: "Mặc định", costPrice: 0, price: 0, instock: 0 })} block icon={<PlusOutlined />}>Thêm Kích cỡ mới</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}