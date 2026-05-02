import api from "./api";

export const getDashboardSummary = async () => {
  const res = await api.get("/api/dashboard/summary");
  return res.data;
};

export const getOrdersByMonth = async () => {
  try {
    const res = await api.get("/api/dashboard/orders-by-month");
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu biểu đồ:", error);
    throw error;
  }
};

export const getOrdersToday = async () => {
  const res = await api.get("/api/dashboard/orders-today");
  return res.data;
};

export const getOrdersThisWeek = async () => {
  const res = await api.get("/api/dashboard/orders-this-week");
  return res.data;
};

export const getTopProducts = async () => {
  const res = await api.get("/api/dashboard/top-products");
  return res.data;
};

export const getOrderStatusStats = async () => {
  try {
    const res = await api.get("/api/dashboard/order-status-stats");
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu trạng thái đơn hàng:", error);
    throw error;
  }
};

export const getRevenueByCategory = async () => {
  try {
    const res = await api.get("/api/dashboard/revenue-by-category");
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu doanh thu theo danh mục:", error);
    throw error;
  }
};

export const getLowStockProducts = async (threshold = 10) => {
  try {
    const res = await api.get(`/api/dashboard/low-stock?threshold=${threshold}`);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy dữ liệu cảnh báo hết hàng:", error);
    throw error;
  }
};