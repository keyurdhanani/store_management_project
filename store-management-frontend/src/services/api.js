// store-management-frontend/src/services/api.js

import axios from 'axios';

// Create an instance of axios with a base URL
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', 
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- FETCH FUNCTIONS ---
export const fetchProducts = () => api.get('/products/');
export const fetchCategories = () => api.get('/categories/');
export const fetchSuppliers = () => api.get('/suppliers/');
export const fetchPurchases = () => api.get('/purchases/');
export const fetchDashboardStats = () => api.get('/dashboard/stats/');
export const fetchLowStockList = () => api.get('/dashboard/low-stock/');

// --- PRODUCT OPERATIONS ---
export const createProduct = (productData) => api.post('/products/', productData);
export const updateProduct = (productId, productData) => api.put(`/products/${productId}/`, productData);
export const deleteProduct = (productId) => api.delete(`/products/${productId}/`);

// --- SUPPLIER OPERATIONS (NEW: Added Update and Delete) ---
export const createSupplier = (supplierData) => api.post('/suppliers/', supplierData);
export const updateSupplier = (supplierId, supplierData) => api.put(`/suppliers/${supplierId}/`, supplierData);
export const deleteSupplier = (supplierId) => api.delete(`/suppliers/${supplierId}/`);

// --- TRANSACTION OPERATIONS ---
export const createPurchase = (purchaseData) => api.post('/purchases/', purchaseData); 
export const createSaleInvoice = (invoiceData) => api.post('/sales/', invoiceData);
export const updateSaleInvoice = (invoiceId, invoiceData) => api.put(`/sales/${invoiceId}/`, invoiceData); 

// HISTORY ---
export const fetchSalesHistory = () => api.get('/history/sales/');
export const fetchPurchaseHistory = () => api.get('/history/purchases/');
export const exportSalesCSV = () => api.get('/export/sales/', { responseType: 'blob' }); 
export default api;