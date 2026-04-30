import axios from "axios";

const API_BASE_URL = "https://nyumbaflow.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Auth endpoints
export const authAPI = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Houses endpoints
export const housesAPI = {
  getAll: () => api.get("/houses"),
  getOne: (id: string) => api.get(`/houses/${id}`),
  create: (data: any) => api.post("/houses", data),
  update: (id: string, data: any) => api.put(`/houses/${id}`, data),
  delete: (id: string) => api.delete(`/houses/${id}`),
};

// Tenants endpoints
export const tenantsAPI = {
  getAll: () => api.get("/tenants"),
  getOne: (id: string) => api.get(`/tenants/${id}`),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
};

// Payments endpoints
export const paymentsAPI = {
  getAll: () => api.get("/payments"),
  getByTenant: (tenantId: string) => api.get(`/payments/tenant/${tenantId}`),
  create: (data: any) => api.post("/payments", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/payments/${id}/status`, { status }),
};

// Complaints endpoints
export const complaintsAPI = {
  getAll: () => api.get("/complaints"),
  getByTenant: (tenantId: string) => api.get(`/complaints/tenant/${tenantId}`),
  create: (data: any) => api.post("/complaints", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/complaints/${id}/status`, { status }),
};

// Notices endpoints
export const noticesAPI = {
  getAll: () => api.get("/notices"),
  getByTenant: (tenantId: string) => api.get(`/notices/tenant/${tenantId}`),
  create: (data: any) => api.post("/notices", data),
  markAsRead: (noticeId: string, tenantId: string) =>
    api.post(`/notices/${noticeId}/read/${tenantId}`),
};

// Reports endpoints
export const reportsAPI = {
  getStats: () => api.get("/reports/stats"),
  getMonthlyRevenue: () => api.get("/reports/monthly-revenue"),
};

export default api;
