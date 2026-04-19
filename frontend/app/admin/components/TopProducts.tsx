import { Table, Card } from "antd";

export default function TopProducts({ data }: { data: any[] }) {
  const columns = [
    { title: "Sản phẩm", dataIndex: "productName" },
    { title: "Số lượng", dataIndex: "quantitySold" },
    {
      title: "Tổng tiền",
      dataIndex: "revenue",
      render: (v: number) => `${v.toLocaleString()} ₫`,
    },
  ];

  return (
    <Card title="Top 5 sản phẩm bán chạy nhất">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="productId"
        pagination={false}
      />
    </Card>
  );
}
