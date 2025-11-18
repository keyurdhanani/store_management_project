import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL, 
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// --- 1. FETCH FUNCTIONS (GET) ---
// 
export const fetchProducts = () => api.get('/products/');
export const fetchCategories = () => api.get('/categories/');
export const fetchSuppliers = () => api.get('/suppliers/');
export const fetchPurchases = () => api.get('/purchases/'); 
export const fetchDashboardStats = () => api.get('/dashboard/stats/');
export const fetchLowStockList = () => api.get('/dashboard/low-stock/');
export const fetchSalesHistory = () => api.get('/history/sales/');
export const fetchPurchaseHistory = () => api.get('/history/purchases/');

// --- 2. PRODUCT OPERATIONS (CRUD) ---
export const createProduct = (productData) => api.post('/products/', productData);
export const updateProduct = (productId, productData) => api.put(`/products/${productId}/`, productData);
export const deleteProduct = (productId) => api.delete(`/products/${productId}/`);

// --- 3. SUPPLIER OPERATIONS (CRUD) ---
export const createSupplier = (supplierData) => api.post('/suppliers/', supplierData);
export const updateSupplier = (supplierId, supplierData) => api.put(`/suppliers/${supplierId}/`, supplierData);
export const deleteSupplier = (supplierId) => api.delete(`/suppliers/${supplierId}/`);

// --- 4. PURCHASE OPERATIONS (CRUD) ---
export const createPurchase = (purchaseData) => api.post('/purchases/', purchaseData); 
export const updatePurchase = (purchaseId, purchaseData) => api.put(`/purchases/${purchaseId}/`, purchaseData);
export const deletePurchase = (purchaseId) => api.delete(`/purchases/${purchaseId}/`);

// --- 5. SALES OPERATIONS (CUD) ---
export const createSaleInvoice = (invoiceData) => api.post('/sales/', invoiceData);
export const updateSaleInvoice = (invoiceId, invoiceData) => api.put(`/sales/${invoiceId}/`, invoiceData); 

// --- 6. EXPORT / REPORTS ---
export const exportSalesCSV = () => api.get('/export/sales/', { responseType: 'blob' }); 

// --- 7. AUTHENTICATION FUNCTIONS ---

export const login = (credentials) => api.post('/token/', credentials);

export const register = (userData) => api.post('/auth/register/', userData);

export const refreshToken = (refresh) => api.post('/token/refresh/', { refresh });

export default api;