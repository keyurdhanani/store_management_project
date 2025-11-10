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

export default api;