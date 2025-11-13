import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin API
export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/api/admin/login', { email, password }),

  getDashboard: () => api.get('/api/admin/dashboard'),

  getClients: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/api/admin/clients', { params }),

  getClient: (id: number) => api.get(`/api/admin/clients/${id}`),

  createClient: (data: {
    company_name: string;
    email: string;
    password: string;
    domain?: string;
    subscription_plan?: string;
    trial_days?: number;
  }) => api.post('/api/admin/clients', data),

  updateClientSubscription: (id: number, data: {
    subscription_plan?: string;
    subscription_status?: string;
    billing_cycle?: string;
  }) => api.patch(`/api/admin/clients/${id}/subscription`, data),

  getRevenueAnalytics: (period?: string) =>
    api.get('/api/admin/analytics/revenue', { params: { period } }),
};

// Client API
export const clientApi = {
  signup: (data: { company_name: string; email: string; password: string; domain?: string }) =>
    api.post('/api/client/signup', data),

  login: (email: string, password: string) =>
    api.post('/api/client/login', { email, password }),

  getProfile: () => api.get('/api/client/profile'),

  updateProfile: (data: { company_name?: string; domain?: string }) =>
    api.patch('/api/client/profile', data),

  changePassword: (current_password: string, new_password: string) =>
    api.post('/api/client/change-password', { current_password, new_password }),

  getDashboard: () => api.get('/api/client/dashboard'),

  getEmbedCode: () => api.get('/api/client/embed-code'),
};

// Experiments API
export const experimentsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/api/client/experiments', { params }),

  getOne: (id: number) => api.get(`/api/client/experiments/${id}`),

  create: (data: {
    name: string;
    description?: string;
    type: string;
    traffic_allocation?: number;
    primary_goal?: string;
    secondary_goals?: any;
    targeting_rules?: any;
    start_date?: string;
    end_date?: string;
  }) => api.post('/api/client/experiments', data),

  update: (id: number, data: any) =>
    api.patch(`/api/client/experiments/${id}`, data),

  delete: (id: number) => api.delete(`/api/client/experiments/${id}`),

  createVariant: (experimentId: number, data: {
    name: string;
    type?: string;
    traffic_percentage?: number;
    changes?: any;
    custom_code?: string;
    is_control?: boolean;
  }) => api.post(`/api/client/experiments/${experimentId}/variants`, data),

  updateVariant: (experimentId: number, variantId: number, data: any) =>
    api.patch(`/api/client/experiments/${experimentId}/variants/${variantId}`, data),

  getResults: (id: number, params?: { start_date?: string; end_date?: string }) =>
    api.get(`/api/client/experiments/${id}/results`, { params }),
};

export default api;

