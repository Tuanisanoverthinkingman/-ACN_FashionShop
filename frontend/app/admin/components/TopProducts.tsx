"use client";

import { Table, Card, Typography, Tag } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function TopProducts({ data }: { data: any[] }) {
const columns = [
    {
      title: "Hạng",
      key: "rank",
      width: 70,
      align: "center" as const,
      render: (_: any, __: any, index: number) => {
        let color = "default";
        if (index === 0) color = "volcano"; 
        else if (index === 1) color = "orange"; 
        else if (index === 2) color = "gold";   
        
        return (
          <Tag color={color} style={{ borderRadius: '6px', fontWeight: 'bold', margin: 0 }}>
            #{index + 1}
          </Tag>
        );
      },
    },
    { 
      title: "Tên sản phẩm", 
      dataIndex: "productName",
      ellipsis: true,
      render: (text: string) => <Text style={{ fontWeight: 500 }} title={text}>{text}</Text>
    },
    { 
      title: "Đã bán", 
      dataIndex: "quantitySold",
      width: 80, 
      align: "right" as const, 
      render: (val: number) => <Text style={{ fontWeight: 600, color: '#0ea5e9' }}>{val}</Text>
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      width: 130,
      align: "right" as const, 
      render: (val: number) => (
        <div style={{ whiteSpace: "nowrap", fontWeight: 600, color: '#10b981' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
        </div>
      ),
    },
  ];

  return (
    <Card 
      bordered={false}
      style={{ 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        height: '100%'
      }}
      headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
      bodyStyle={{ padding: '0' }} 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: '#fffbeb', borderRadius: '8px', color: '#d97706', display: 'flex' }}>
            <TrophyOutlined style={{ fontSize: '20px' }} />
          </div>
          <Title level={4} style={{ margin: 0, color: '#334155', fontSize: '18px', fontWeight: 600 }}>
            Top 5 Sản Phẩm Bán Chạy
          </Title>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="productId"
        pagination={false}
        size="middle"
      />
    </Card>
  );
}