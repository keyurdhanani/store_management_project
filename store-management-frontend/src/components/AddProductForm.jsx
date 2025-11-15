// store-management-frontend/src/components/AddProductForm.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { fetchCategories, createProduct, updateProduct } from '../services/api';
import { FaSave, FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';

const initialFormData = {
    name: '',
    category: '', 
    base_price: '',
    description: '',
    low_stock_threshold: 10,
    expiry_date: '',
};

const AddProductForm = ({ onProductAdded, onCancel, initialData }) => {
    
    // Initialize formData using initialData if available
    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        base_price: initialData.base_price.toString() 
    } : initialFormData);
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const isEditMode = !!initialData;
    
    // Load Categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetchCategories();
                setCategories(response.data);
                if (response.data.length > 0 && !isEditMode && !initialData) {
                    setFormData(prev => ({ ...prev, category: response.data[0].id }));
                }
            } catch (err) {
                console.error("Error loading categories:", err);
                setError("Could not load categories.");
            }
        };
        loadCategories();
    }, [isEditMode, initialData]);

    // Handle initialData changes (for modal reuse)
    useEffect(() => {
        if (initialData) {
            setFormData({ 
                ...initialData, 
                base_price: initialData.base_price.toString(),
                category: initialData.category 
            });
            setError(null);
            setSuccess(false);
        } else {
             setFormData(initialFormData);
        }
    }, [initialData]);

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
        setSuccess(false);

        const dataToSend = {
            ...formData,
            base_price: parseFloat(formData.base_price),
            category: parseInt(formData.category),
        };

        try {
            if (isEditMode) {
                // UPDATE
                await updateProduct(initialData.id, dataToSend); 
                setSuccess(true);
            } else {
                // CREATE
                await createProduct(dataToSend);
                setSuccess(true);
                setFormData(initialFormData); 
            }

            if (onProductAdded) {
                onProductAdded(); 
            }
        } catch (err) {
            console.error("API call failed:", err.response ? err.response.data : err);
            setError(err.response?.data?.name?.[0] || `Failed to ${isEditMode ? 'update' : 'create'} product. Check console for details.`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Container className={isEditMode ? "p-0" : "my-5"}>
            <Card className={isEditMode ? "border-0" : "shadow-lg border-0"}>
                <Card.Header className={isEditMode ? "d-none" : "bg-primary text-white"}>
                    <h3 className="mb-0"><FaPlus className="me-2" /> Add New Product</h3>
                </Card.Header>
                
                <Card.Body>
                    <h3 className="mb-4 text-primary">
                        {isEditMode ? `✏️ Edit Product: ${initialData.name}` : "📝 Add New Product"}
                    </h3>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Product {isEditMode ? 'updated' : 'added'} successfully!</Alert>}

                    <Form onSubmit={handleSubmit}>
                        {/* 1. Basic Details Group */}
                        <h5 className="mt-3 mb-3 text-secondary">Basic Information</h5>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group controlId="formName">
                                    <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
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
                                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
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
                        
                        {/* 2. Stock & Pricing Group */}
                        <h5 className="mt-4 mb-3 text-secondary">Pricing & Stock Control</h5>
                        <Row className="mb-4">
                            <Col md={4}>
                                <Form.Group controlId="formPrice">
                                    <Form.Label>Base Price (₹ INR) <span className="text-danger">*</span></Form.Label>
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
                                    <Form.Label>Low Stock Threshold <span className="text-danger">*</span></Form.Label>
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

                        {/* 3. Description */}
                        <Form.Group controlId="formDescription" className="mb-4">
                            <Form.Label>Description (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* 4. Action Buttons */}
                        <div className="d-flex justify-content-end pt-3 border-top">
                            <Button variant="secondary" onClick={onCancel} className="me-2" disabled={loading}>
                                <FaTimes className="me-2" /> Cancel
                            </Button>
                            
                            <Button variant="success" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <FaSpinner className="fa-spin me-2" /> {isEditMode ? 'Saving...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-2" /> {isEditMode ? 'Save Changes' : 'Add Product'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AddProductForm;