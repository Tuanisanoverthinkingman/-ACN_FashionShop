import { Row, Col, Card, Statistic } from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

export default function SummaryCards({ summary }: any) {
  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card hoverable>
          <Statistic title="Users" value={summary.totalUsers} prefix={<UserOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card hoverable>
          <Statistic title="Orders" value={summary.totalOrders} prefix={<ShoppingCartOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card hoverable>
          <Statistic title="Revenue" value={summary.totalRevenue} prefix={<DollarOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card hoverable>
          <Statistic title="Products" value={summary.totalProducts} prefix={<AppstoreOutlined />} />
        </Card>
      </Col>
    </Row>
  );
}
