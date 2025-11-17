// store-management-frontend/src/components/SupplierManagement.jsx

import React, { useState, useEffect } from 'react';
import { Table, Container, Button, Alert, Form, Row, Col, Card } from 'react-bootstrap';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api'; 
// We will use FaEdit and FaTrash, as 'bi' icons require a separate library import
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'; 

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
  // Reintroduced showForm state
  const [showForm, setShowForm] = useState(false); 
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
  }, [refreshKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Function to load the selected supplier data into the form for editing
  const handleEditClick = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    });
    setError(null); 
    setShowForm(true); // Show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to clear the form and switch to Create mode
  const handleCancelEdit = () => {
    setSelectedSupplier(null);
    setFormData(initialFormData);
    setError(null);
    setShowForm(false); // Hide the form
  };

  // Function to handle deletion
  const handleDeleteClick = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete supplier ${name}?`)) {
      setError(null); // Clear previous errors
      try {
        await deleteSupplier(id);
        setSuccessMessage(`Supplier **${name}** deleted successfully!`);
        setRefreshKey(prev => prev + 1); // Trigger data refresh
        
        if (selectedSupplier && selectedSupplier.id === id) {
            handleCancelEdit(); 
        }

        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Supplier deletion failed:", err.response ? err.response.data : err);
        setError("Failed to delete supplier. It may be linked to existing purchases.");
      }
    }
  };

  // MERGED handleSubmit FUNCTION
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const isEditMode = !!selectedSupplier;

    try {
      if (isEditMode) {
        await updateSupplier(selectedSupplier.id, formData);
        setSuccessMessage(`Supplier **${formData.name}** updated successfully!`);
        setSelectedSupplier(null); // Exit edit mode
      } else {
        await createSupplier(formData);
        setSuccessMessage(`Supplier **${formData.name}** added successfully!`);
      }

      setFormData(initialFormData);
      setShowForm(false); // Hide the form after success
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("API call failed:", err.response ? err.response.data : err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} supplier. Please check inputs.`);
    }
  };

  if (loading) {
    return <Container className="mt-5">Loading suppliers...</Container>;
  }

  return (
    <Container className="my-4">
      
      {/* UPDATE BUTTON LOGIC */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-secondary">🚚 Supplier Management</h1>
        <Button 
          // Show Add/Cancel button
          variant={showForm && !selectedSupplier ? "danger" : "primary"} 
          onClick={() => {
            // If the form is currently hidden, show it in ADD mode.
            // If the form is currently visible (in ADD mode), hide it.
            // If in EDIT mode, this button is not shown, but the form handles its own cancel.
            setShowForm(!showForm);
            setSelectedSupplier(null); // Always switch to Add mode if form is toggled
            setFormData(initialFormData);
          }}
        >
          {showForm && !selectedSupplier ? 'Cancel Add' : '➕ Add New Supplier'}
        </Button>
      </div>

      {/* UPDATE ALERT DISPLAY (Dismissible) */}
      {successMessage && <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}


      {/* Add/Edit Supplier Form (Renders when showForm is true OR we are editing) */}
      {(showForm || selectedSupplier) && (
        <Card className="mb-4 shadow-lg border-primary">
          <Card.Body>
            {/* UPDATE Card Title */}
            <Card.Title className="text-primary">
                {selectedSupplier ? `Edit Supplier: ${selectedSupplier.name}` : 'Add New Supplier'}
            </Card.Title>
            
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
              
              {/* UPDATE Form Submission Button Text */}
              <Button variant={selectedSupplier ? "warning" : "success"} type="submit">
                {selectedSupplier ? 'Save Changes' : 'Save Supplier'}
              </Button>
              
              {selectedSupplier && (
                <Button variant="secondary" className="ms-2" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Supplier List Table */}
      <h2 className="text-secondary mb-3 mt-5">Supplier List</h2>
      <Table striped bordered hover responsive className="mt-4 shadow-sm">
        <thead>
          <tr className="table-secondary">
            <th>Name</th>
            <th>Contact</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className={selectedSupplier && selectedSupplier.id === supplier.id ? 'table-info' : ''}>
              <td>**{supplier.name}**</td>
              <td>{supplier.contact_person}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.email}</td>
              <td>{supplier.address}</td>
              <td className="text-nowrap">
                {/* UPDATE Actions Column using react-icons */}
                <Button variant="info" size="sm" className="me-2" onClick={() => handleEditClick(supplier)}>
                  <FaEdit className="me-1" /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(supplier.id, supplier.name)}>
                  <FaTrash className="me-1" /> Delete
                </Button>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-muted">No suppliers found.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default SupplierManagement;