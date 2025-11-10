// store-management-frontend/src/components/ProductList.jsx

import React, { useState, useEffect } from 'react';
import { Table, Container, Button, Alert } from 'react-bootstrap';
import { fetchProducts } from '../services/api'; // Import the API function

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch data from the backend
  const loadProducts = async () => {
    try {
      const response = await fetchProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load product data. Check API server status.");
      setLoading(false);
    }
  };

  // useEffect runs once when the component mounts
  useEffect(() => {
    loadProducts();
  }, []); // Empty dependency array ensures it runs only once

  if (loading) {
    return <Container className="mt-5">Loading products...</Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h2>📦 Product Inventory List</h2>
      <div className="mb-3 d-flex justify-content-end">
        <Button variant="success">Add New Product</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr className="table-primary">
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price (INR)</th>
            <th>Stock Qty</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            // Use Conditional Formatting based on Stock/Expiry Status
            <tr key={product.id} className={getProductRowClass(product)}>
              <td>{index + 1}</td>
              <td>**{product.name}**</td>
              <td>{product.category_name}</td>
              <td>₹ {product.base_price}</td>
              <td>{product.stock_details.quantity}</td>
              <td>{product.stock_details.expiry_date || 'N/A'}</td>
              <td>{getStockStatus(product)}</td>
              <td>
                <Button variant="info" size="sm" className="me-2">Edit</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
                <td colSpan="8" className="text-center">No products found. Please add new products.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

// --- Helper Functions for Conditional UI ---

// Checks if the product is low on stock
const isLowStock = (product) => {
    const stock = product.stock_details;
    return stock.quantity <= stock.low_stock_threshold && stock.quantity > 0;
}

// Checks if the product is expired (Simple check for now)
const isExpired = (product) => {
    if (!product.stock_details.expiry_date) return false;
    const expiryDate = new Date(product.stock_details.expiry_date);
    const today = new Date();
    // Compare dates without time to ensure accurate expiry check
    return expiryDate < today; 
}

// Determines the visual class (color) of the table row
const getProductRowClass = (product) => {
    if (isExpired(product)) return 'table-danger'; // Red for expired
    if (isLowStock(product)) return 'table-warning'; // Yellow for low stock
    return '';
}

// Determines the text status for the Status column
const getStockStatus = (product) => {
    if (isExpired(product)) return <span className="text-danger fw-bold">EXPIRED</span>;
    if (isLowStock(product)) return <span className="text-warning fw-bold">LOW STOCK</span>;
    if (product.stock_details.quantity === 0) return <span className="text-secondary">OUT OF STOCK</span>;
    return <span className="text-success">In Stock</span>;
}


export default ProductList;