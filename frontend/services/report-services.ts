import api from "./api";

export const getDashboardSummary = async () => {
  const res = await api.get("/api/dashboard/summary");
  return res.data;
};

export const getOrdersByMonth = async () => {
  const res = await api.get("/api/dashboard/orders-by-month");
  return res.data;
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
