// store-management-frontend/src/components/PurchaseEntryPage.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { fetchProducts, fetchSuppliers, createPurchase } from '../services/api';

const initialFormData = {
  product: '', 
  supplier: '',
  purchase_quantity: 1,
  unit_purchase_price: 0.01,
  invoice_number: '',
};

const PurchaseEntryPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch Products and Suppliers concurrently
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [productsRes, suppliersRes] = await Promise.all([
          fetchProducts(),
          fetchSuppliers(),
        ]);

        setProducts(productsRes.data);
        setSuppliers(suppliersRes.data);

        // Set initial selection for product/supplier if available
        if (productsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, product: productsRes.data[0].id }));
        }
        if (suppliersRes.data.length > 0) {
          setFormData(prev => ({ ...prev, supplier: suppliersRes.data[0].id }));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading form data:", err);
        setError("Failed to load products or suppliers.");
        setLoading(false);
      }
    };
    loadDependencies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setSuccess(false); 
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare data: convert IDs and price/quantity to correct number types
    const dataToSend = {
        ...formData,
        product: parseInt(formData.product),
        supplier: parseInt(formData.supplier),
        purchase_quantity: parseInt(formData.purchase_quantity),
        unit_purchase_price: parseFloat(formData.unit_purchase_price),
    };

    try {
      await createPurchase(dataToSend);
      setSuccess(true);
      // Optional: Clear form or keep product/supplier selected for rapid entry
      setFormData(prev => ({ 
          ...initialFormData, 
          product: prev.product, 
          supplier: prev.supplier 
      })); 
    } catch (err) {
      console.error("Purchase entry failed:", err.response ? err.response.data : err);
      setError("Failed to record purchase. Ensure product and supplier are selected.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container className="mt-5">Loading purchase form...</Container>;
  }

  if (error && !success) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="my-5">
      <Card className="p-4 shadow">
        <h3 className="mb-4 text-success">💰 Record New Stock Purchase</h3>
        {success && <Alert variant="success">Purchase recorded successfully! Stock has been updated.</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formProduct">
                <Form.Label>Product</Form.Label>
                <Form.Select
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  required
                  disabled={products.length === 0}
                >
                  {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
                {products.length === 0 && <Alert variant="warning" className="mt-2">No products available. Add a product first!</Alert>}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formSupplier">
                <Form.Label>Supplier</Form.Label>
                <Form.Select
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  required
                  disabled={suppliers.length === 0}
                >
                  {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
                {suppliers.length === 0 && <Alert variant="warning" className="mt-2">No suppliers available. Add a supplier first!</Alert>}
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="formQuantity">
                <Form.Label>Quantity Purchased</Form.Label>
                <Form.Control
                  type="number"
                  name="purchase_quantity"
                  value={formData.purchase_quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formPrice">
                <Form.Label>Unit Purchase Price (INR)</Form.Label>
                <Form.Control
                  type="number"
                  name="unit_purchase_price"
                  value={formData.unit_purchase_price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formInvoice">
                <Form.Label>Invoice Number (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="success" type="submit" disabled={loading || products.length === 0 || suppliers.length === 0}>
              {loading ? 'Recording...' : 'Record Purchase'}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default PurchaseEntryPage;