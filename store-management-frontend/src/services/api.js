import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Create a raw Axios instance for unauthenticated calls (login, refresh, register)
const publicApi = axios.create({
    baseURL: API_URL, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Create the protected Axios instance for all authenticated calls
const api = axios.create({
    baseURL: API_URL, 
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ===================================================
// 1. REQUEST Interceptor: Attach Access Token
// ===================================================
api.interceptors.request.use(config => {
    // Only attach the token if one exists
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


// ===================================================
// 2. RESPONSE Interceptor: Handle Token Refresh (401 Errors)
// ===================================================
let isRefreshing = false;
let failedQueue = [];

// Helper function to process the queue of failed requests
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            // Reject pending requests if refresh failed
            prom.reject(error);
        } else {
            // Resolve pending requests with the new token
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Check for 401 status AND prevent infinite loop on the refresh request itself
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Queue the request if a refresh is already in progress
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                })
                .then(token => {
                    // Pass the new token through the promise chain
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            // Start the refresh process
            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                // No refresh token available, cannot proceed.
                isRefreshing = false;
                // If you use an AuthContext, ensure you call the logout function here globally
                return Promise.reject(error); 
            }

            try {
                // Use publicApi (unauthenticated) for the token refresh call
                const rs = await publicApi.post('/token/refresh/', { refresh: refreshToken });
                const { access } = rs.data;

                // 1. Save new token
                localStorage.setItem('access_token', access);
                
                // 2. Update the original request's header with the new token
                originalRequest.headers['Authorization'] = 'Bearer ' + access;

                // 3. Process all requests that failed during the refresh period
                processQueue(null, access);
                isRefreshing = false;

                // 4. Retry the original request that triggered the refresh
                return api(originalRequest);

            } catch (err) {
                // Refresh token also failed/expired. Clear tokens and log out globally.
                console.error("Token refresh failed. Logging user out.", err);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                processQueue(err);
                isRefreshing = false;
                
                // Reject the error so AuthContext can force a hard logout/redirect
                return Promise.reject(err);
            }
        }
        
        // For any other error (e.g., 400, 403, 500) or if no tokens are found, reject normally
        return Promise.reject(error);
    }
);


// ===================================================
// 3. EXPORT FUNCTIONS 
// ===================================================

// --- FETCH FUNCTIONS (GET) ---
export const fetchProducts = () => api.get('/products/');
export const fetchCategories = () => api.get('/categories/');
export const fetchSuppliers = () => api.get('/suppliers/');
export const fetchPurchases = () => api.get('/purchases/'); 
export const fetchDashboardStats = () => api.get('/dashboard/stats/');
export const fetchLowStockList = () => api.get('/dashboard/low-stock/');
export const fetchSalesHistory = () => api.get('/history/sales/');
export const fetchPurchaseHistory = () => api.get('/history/purchases/');
export const fetchProfitMargins = () => api.get('/dashboard/margins/');
export const fetchProductDetail = (id) => api.get(`/products/${id}/`);

// --- PRODUCT OPERATIONS (CRUD) ---
export const createProduct = (productData) => api.post('/products/', productData);
export const updateProduct = (productId, productData) => api.put(`/products/${productId}/`, productData);
// NOTE: deleteProduct is still exported but SHOULD NOT be used for historical products.
export const deleteProduct = (productId) => api.delete(`/products/${productId}/`);

// --- SUPPLIER OPERATIONS (CRUD) ---
export const createSupplier = (supplierData) => api.post('/suppliers/', supplierData);
export const updateSupplier = (supplierId, supplierData) => api.put(`/suppliers/${supplierId}/`, supplierData);
export const deleteSupplier = (supplierId) => api.delete(`/suppliers/${supplierId}/`);

// --- PURCHASE OPERATIONS (CRUD) ---
export const createPurchase = (purchaseData) => api.post('/purchases/', purchaseData); 
export const updatePurchase = (purchaseId, purchaseData) => api.put(`/purchases/${purchaseId}/`, purchaseData);
export const deletePurchase = (purchaseId) => api.delete(`/purchases/${purchaseId}/`);

// --- SALES OPERATIONS (CUD) ---
export const createSaleInvoice = (invoiceData) => api.post('/sales/', invoiceData);
export const updateSaleInvoice = (invoiceId, invoiceData) => api.put(`/sales/${invoiceId}/`, invoiceData); 

// --- EXPORT / REPORTS ---
export const exportSalesCSV = () => api.get('/export/sales/', { responseType: 'blob' }); 

// --- AUTHENTICATION FUNCTIONS (Use publicApi for token and register) ---

export const login = (credentials) => publicApi.post('/token/', credentials);

export const register = (userData) => publicApi.post('/auth/register/', userData);

// refreshToken is handled internally by the interceptor
export const refreshToken = (refresh) => publicApi.post('/token/refresh/', { refresh });

export default api;