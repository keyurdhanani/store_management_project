// store-management-frontend/src/components/AddProductForm.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { fetchCategories, createProduct } from '../services/api';

const initialFormData = {
  name: '',
  category: '', // Will hold the category ID
  base_price: '',
  description: '',
  low_stock_threshold: 10,
  expiry_date: '',
};

const AddProductForm = ({ onProductAdded, onCancel }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch categories when the component loads
    const loadCategories = async () => {
      try {
        const response = await fetchCategories();
        setCategories(response.data);
        // Pre-select the first category if available
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, category: response.data[0].id }));
        }
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Could not load categories.");
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setSuccess(false); // Clear success message on change
    setError(null);    // Clear error message on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Prepare data for the API
    const dataToSend = {
        ...formData,
        // Ensure base_price is a number
        base_price: parseFloat(formData.base_price),
        // Ensure category is an ID (integer)
        category: parseInt(formData.category),
        // DRF will automatically create the Stock entry with default quantity=0
    };

    try {
      await createProduct(dataToSend);
      setSuccess(true);
      setFormData(initialFormData); // Clear form after successful submission
      if (onProductAdded) {
        onProductAdded(); // Trigger refresh in parent component (ProductList)
      }
    } catch (err) {
      console.error("Product creation failed:", err.response ? err.response.data : err);
      // Attempt to display specific validation errors from Django
      setError(err.response?.data?.name?.[0] || "Failed to create product. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5 p-4 border rounded shadow-sm">
      <h3 className="mb-4 text-primary">📝 Add New Product</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Product added successfully!</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="formName">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="formCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.length === 0 ? (
                    <option>Loading categories...</option>
                ) : (
                    categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                )}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="formPrice">
              <Form.Label>Base Price (INR)</Form.Label>
              <Form.Control
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formExpiry">
              <Form.Label>Expiry Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="formThreshold">
              <Form.Label>Low Stock Threshold</Form.Label>
              <Form.Control
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="1"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="formDescription" className="mb-3">
          <Form.Label>Description (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </Form.Group>

        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onCancel} className="me-2">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AddProductForm;