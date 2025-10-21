import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  me: () =>
    api.get('/auth/me'),
};

// Clients API
export const clientsApi = {
  list: (params) =>
    api.get('/admin/clients', { params }),
  
  get: (id) =>
    api.get(`/admin/clients/${id}`),
  
  create: (data) =>
    api.post('/admin/clients', data),
  
  update: (id, data) =>
    api.put(`/admin/clients/${id}`, data),
  
  delete: (id) =>
    api.delete(`/admin/clients/${id}`),
  
  stats: () =>
    api.get('/admin/clients/stats'),
};

// Galleries API (public)
export const galleriesApi = {
  getByToken: (token, password) =>
    api.post(`/galleries/${token}`, { password }),
  
  listAssets: (token) =>
    api.get(`/galleries/${token}/assets`),
};

// Invoices API (public payment)
export const invoicesApi = {
  getPublic: (id) =>
    api.get(`/invoices/${id}/public`),
  
  createPaymentIntent: (id) =>
    api.post(`/invoices/${id}/payment-intent`),
};

// Admin Galleries API
export const adminGalleriesApi = {
  list: (params) =>
    api.get('/admin/galleries', { params }),
  
  get: (id) =>
    api.get(`/admin/galleries/${id}`),
  
  create: (data) =>
    api.post('/admin/galleries', data),
  
  update: (id, data) =>
    api.put(`/admin/galleries/${id}`, data),
  
  delete: (id) =>
    api.delete(`/admin/galleries/${id}`),
  
  addAssets: (id, assetIds) =>
    api.post(`/admin/galleries/${id}/assets`, { assetIds }),
  
  removeAsset: (id, assetId) =>
    api.delete(`/admin/galleries/${id}/assets/${assetId}`),
};

// Invoices Admin API
export const adminInvoicesApi = {
  list: (params) =>
    api.get('/admin/invoices', { params }),
  
  get: (id) =>
    api.get(`/admin/invoices/${id}`),
  
  create: (data) =>
    api.post('/admin/invoices', data),
  
  update: (id, data) =>
    api.put(`/admin/invoices/${id}`, data),
  
  delete: (id) =>
    api.delete(`/admin/invoices/${id}`),
  
  send: (id) =>
    api.post(`/admin/invoices/${id}/send`),
  
  markPaid: (id) =>
    api.post(`/admin/invoices/${id}/paid`),
};

// Proposals Admin API
export const adminProposalsApi = {
  list: (params) =>
    api.get('/admin/proposals', { params }),
  
  get: (id) =>
    api.get(`/admin/proposals/${id}`),
  
  create: (data) =>
    api.post('/admin/proposals', data),
  
  update: (id, data) =>
    api.put(`/admin/proposals/${id}`, data),
  
  delete: (id) =>
    api.delete(`/admin/proposals/${id}`),
  
  send: (id) =>
    api.post(`/admin/proposals/${id}/send`),
};

// Records Admin API
export const adminRecordsApi = {
  list: (params) =>
    api.get('/admin/records', { params }),
  
  get: (id) =>
    api.get(`/admin/records/${id}`),
  
  archive: (data) =>
    api.post('/admin/records/archive', data),
  
  verify: (id) =>
    api.post(`/admin/records/${id}/verify`),
  
  verifyAll: () =>
    api.post('/admin/records/verify-all'),
  
  stats: () =>
    api.get('/admin/records/stats'),
};

export default api;