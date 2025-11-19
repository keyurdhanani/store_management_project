// store-management-frontend/src/components/AddProductForm.jsx

import React, { useState, useEffect } from 'react';
import { 
    Form, Button, Container, Row, Col, Alert, Card, InputGroup 
} from 'react-bootstrap';

import { fetchCategories, createProduct, updateProduct } from '../services/api';

// Icons
import { 
    FaSave, FaTimes, FaPlus, FaSpinner, FaTag, FaBox, FaList, 
    FaRupeeSign, FaInfoCircle 
} from 'react-icons/fa';

const initialFormData = {
    name: '',
    description: '',
    mrp: '',
    supplier_base_price: '',
    category: '',
};

const AddProductForm = ({ onProductAdded, onCancel, initialData }) => {

    const [formData, setFormData] = useState(initialData ? {
        ...initialData,
        mrp: initialData.mrp?.toString() || '',
        supplier_base_price: (initialData.base_price || initialData.supplier_base_price)?.toString() || '',
        category: initialData.category
    } : initialFormData);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const isEditMode = !!initialData;

    // Load categories
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchCategories();
                setCategories(res.data);

                if (!isEditMode && res.data.length > 0) {
                    setFormData(prev => ({ ...prev, category: res.data[0].id }));
                }
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError("Failed to load categories.");
            }
        };
        load();
    }, [isEditMode]);

    // When modal reuses form
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                mrp: initialData.mrp?.toString() || '',
                supplier_base_price: (initialData.base_price || initialData.supplier_base_price)?.toString() || '',
                category: initialData.category
            });
        } else {
            setFormData(initialFormData);
        }
        setError(null);
        setSuccess(false);
    }, [initialData]);

    // Input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccess(false);
        setError(null);
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const dataToSend = {
            name: formData.name,
            description: formData.description,
            mrp: parseFloat(formData.mrp),
            base_price: parseFloat(formData.supplier_base_price),
            category: parseInt(formData.category),
        };

        try {
            if (isEditMode) {
                await updateProduct(initialData.id, dataToSend);
            } else {
                await createProduct(dataToSend);
                setFormData(initialFormData);
            }

            setSuccess(true);
            onProductAdded && onProductAdded();

        } catch (err) {
            let msg = `Failed to ${isEditMode ? 'update' : 'create'} product.`;

            const backend = err.response?.data;
            if (backend?.base_price) msg = backend.base_price[0];
            if (backend?.name) msg = backend.name[0];

            setError(msg);

        } finally {
            setLoading(false);
        }
    };

    // ===================== UI ==========================
    return (
        <Container className={isEditMode ? "p-0" : "my-4"}>
            <Card className="shadow-sm border-0">

                {!isEditMode && (
                    <Card.Header className="bg-primary text-white">
                        <h4 className="mb-0">
                            <FaPlus className="me-2" /> Add New Product
                        </h4>
                    </Card.Header>
                )}

                <Card.Body>
                    <h4 className="mb-4 text-primary fw-bold">
                        {isEditMode ? (
                            <>✏️ Edit Product — {initialData.name}</>
                        ) : (
                            <>📝 Product Details</>
                        )}
                    </h4>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && (
                        <Alert variant="success">
                            Product {isEditMode ? "updated" : "added"} successfully!
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>

                        {/* ========== BASIC INFO ========== */}
                        <h5 className="text-secondary mb-3">
                            <FaBox className="me-2" /> Basic Information
                        </h5>
                        <Row className="mb-4">

                            {/* Product Name */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Product Name</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FaTag /></InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* Category */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Category</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FaList /></InputGroup.Text>
                                        <Form.Select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </Form.Select>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ========== PRICING ========== */}
                        <h5 className="text-secondary mb-3">
                            <FaRupeeSign className="me-2" /> Pricing
                        </h5>

                        <Row className="mb-4">

                            {/* MRP */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>MRP (Selling Price)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FaRupeeSign /></InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            name="mrp"
                                            min="0"
                                            step="0.01"
                                            value={formData.mrp}
                                            onChange={handleChange}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>

                            {/* Supplier Base Price */}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Supplier Cost Price</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><FaRupeeSign /></InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            name="supplier_base_price"
                                            min="0"
                                            step="0.01"
                                            value={formData.supplier_base_price}
                                            onChange={handleChange}
                                            required
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Mapped to <strong>base_price</strong> in API.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* ========== DESCRIPTION ========== */}
                        <h5 className="text-secondary mb-2">
                            <FaInfoCircle className="me-2" /> Description
                        </h5>

                        <InputGroup className="mb-4">
                            <InputGroup.Text><FaInfoCircle /></InputGroup.Text>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </InputGroup>

                        {/* ========== ACTIONS ========== */}
                        <div className="d-flex justify-content-end border-top pt-3">

                            <Button
                                variant="secondary"
                                className="me-2"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <FaTimes className="me-2" /> Cancel
                            </Button>

                            <Button
                                variant="success"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="fa-spin me-2" />
                                        {isEditMode ? "Saving..." : "Adding..."}
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-2" />
                                        {isEditMode ? "Save Changes" : "Add Product"}
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
