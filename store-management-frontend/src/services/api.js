// store-management-frontend/src/services/api.js

import axios from 'axios';

// Create an instance of axios with a base URL
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Your Django API URL prefix
  timeout: 5000, // Request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export functions to fetch data
export const fetchProducts = () => api.get('/products/');
export const fetchCategories = () => api.get('/categories/');

// You can add more functions here (e.g., createProduct, updateProduct)
export const createProduct = (productData) => api.post('/products/', productData);
export const fetchSuppliers = () => api.get('/suppliers/');
export const createSupplier = (supplierData) => api.post('/suppliers/', supplierData);
export const createPurchase = (purchaseData) => api.post('/purchases/', purchaseData); 
export const createSaleInvoice = (invoiceData) => api.post('/sales/', invoiceData);
export const fetchPurchases = () => api.get('/purchases/'); 
export const fetchDashboardStats = () => api.get('/dashboard/stats/');
export const fetchLowStockList = () => api.get('/dashboard/low-stock/');
export const updateProduct = (productId, productData) => api.put(`/products/${productId}/`, productData);
export const deleteProduct = (productId) => api.delete(`/products/${productId}/`);
export default api;

