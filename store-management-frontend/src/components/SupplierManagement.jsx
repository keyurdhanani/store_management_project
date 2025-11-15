// store-management-frontend/src/components/SupplierManagement.jsx

import React, { useState, useEffect } from 'react';
import { Table, Container, Button, Alert, Form, Row, Col, Card } from 'react-bootstrap';
import { fetchSuppliers, createSupplier } from '../services/api';

const initialFormData = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
};

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For refreshing the list

  // Load Suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await fetchSuppliers();
        setSuppliers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError("Failed to load supplier data.");
        setLoading(false);
      }
    };
    loadSuppliers();
  }, [refreshKey]); // Dependency on refreshKey to reload data

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await createSupplier(formData);
      setFormData(initialFormData); // Clear form
      setShowForm(false); // Hide form
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (err) {
      console.error("Supplier creation failed:", err.response ? err.response.data : err);
      setError("Failed to create supplier. Please check inputs.");
    }
  };

  if (loading) {
    return <Container className="mt-5">Loading suppliers...</Container>;
  }

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-secondary">🚚 Supplier Management</h1>
        <Button 
            variant={showForm ? "danger" : "primary"}
            onClick={() => setShowForm(!showForm)}
        >
            {showForm ? 'Cancel Add' : '➕ Add New Supplier'}
        </Button>
      </div>

      {/* Add Supplier Form */}
      {showForm && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title>Add New Supplier</Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formContact">
                    <Form.Label>Contact Person</Form.Label>
                    <Form.Control type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formPhone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3" controlId="formAddress">
                <Form.Label>Address</Form.Label>
                <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} />
              </Form.Group>
              <Button variant="success" type="submit">
                Save Supplier
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Supplier List Table */}
      <Table striped bordered hover responsive className="mt-4">
        <thead>
          <tr className="table-secondary">
            <th>Name</th>
            <th>Contact</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>**{supplier.name}**</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
              <td>
                <Button variant="info" size="sm" className="me-2">Edit</Button>
                <Button variant="danger" size="sm">Delete</Button>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && (
            <tr>
                <td colSpan="5" className="text-center text-muted">No suppliers found.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default SupplierManagement;