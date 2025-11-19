// store-management-frontend/src/components/ProductList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Container, Button, Alert, Row, Col, Badge, Modal, Card } from 'react-bootstrap';

import { fetchProducts, deleteProduct } from '../services/api';
import AddProductForm from './AddProductForm';

// Icons
import { 
    FaPlus, FaPencilAlt, FaTrash, FaBoxOpen, 
    FaExclamationTriangle, FaCheckCircle, FaBan 
} from 'react-icons/fa';

const ProductList = ({ onAddProductClick }) => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [refreshKey, setRefreshKey] = useState(0);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);


    // =============== LOAD PRODUCTS ==================
    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetchProducts();
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error loading products:", err);
            setError("Failed to load products. Check API.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts, refreshKey]);


    // =============== EVENT HANDLERS ==================
    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setShowEditModal(true);
    };

    const handleEditClose = (refresh = false) => {
        setShowEditModal(false);
        setSelectedProduct(null);

        if (refresh) setRefreshKey(prev => prev + 1);
    };

    const handleDeleteClick = async (id, name) => {
        if (!window.confirm(`⚠️ Permanently delete product: ${name}?`)) return;

        try {
            await deleteProduct(id);
            setSuccessMessage(`Product "${name}" deleted.`);
            setRefreshKey(prev => prev + 1);

            setTimeout(() => setSuccessMessage(null), 3000);
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setErrorMessage(`Failed to delete "${name}".`);
            setTimeout(() => setErrorMessage(null), 3000);
        }
    };


    // =============== RENDER STATES ==================
    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <FaBoxOpen className="fa-spin me-2" /> Loading products...
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }


    // =============== MAIN UI ==================
    return (
        <Container className="mt-4">

            <Row className="mb-3 align-items-center">
                <Col>
                    <h2 className="fw-light text-secondary">
                        📦 Inventory Stock
                    </h2>
                </Col>
                <Col className="text-end">
                    <Button variant="success" onClick={onAddProductClick}>
                        <FaPlus className="me-2" /> Add Product
                    </Button>
                </Col>
            </Row>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

            {/* CARD WRAPPER FOR PRODUCT LIST */}
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white fw-bold">
                    <FaBoxOpen className="me-2" /> Product Inventory
                </Card.Header>

                <Card.Body className="p-0">

                    <Table bordered hover responsive className="mb-0">
                        <thead>
                            <tr className="table-primary text-center">
                                <th>#</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price (₹)</th>
                                <th>Stock</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product, index) => (
                                <tr key={product.id} className={getProductRowClass(product)}>

                                    <td className="text-center">{index + 1}</td>

                                    <td><strong>{product.name}</strong></td>

                                    <td>{product.category_name}</td>

                                    <td>₹{product.base_price}</td>

                                    <td>
                                        {product.stock_details?.quantity ?? 0}
                                    </td>

                                    <td>
                                        {product.stock_details?.expiry_date || "N/A"}
                                    </td>

                                    <td className="text-center">
                                        {getStockStatus(product)}
                                    </td>

                                    <td className="text-center">
                                        <Button 
                                            size="sm"
                                            variant="outline-info"
                                            className="me-2"
                                            onClick={() => handleEditClick(product)}
                                        >
                                            <FaPencilAlt />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => handleDeleteClick(product.id, product.name)}
                                        >
                                            <FaTrash className="me-1" />
                                            Delete
                                        </Button>
                                    </td>

                                </tr>
                            ))}

                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-3">
                                        <FaBan className="me-2" /> No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>

                </Card.Body>
            </Card>


            {/* EDIT MODAL */}
            {selectedProduct && (
                <Modal show={showEditModal} onHide={() => handleEditClose(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            ✏️ Edit Product — {selectedProduct.name}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <AddProductForm
                            initialData={selectedProduct}
                            onProductAdded={() => handleEditClose(true)}
                            onCancel={() => handleEditClose(false)}
                        />
                    </Modal.Body>
                </Modal>
            )}

        </Container>
    );
};


// =============== HELPER FUNCTIONS ==================

const isLowStock = (product) => {
    const s = product.stock_details;
    if (!s) return false;
    return s.quantity <= s.low_stock_threshold && s.quantity > 0;
};

const isExpired = (product) => {
    const s = product.stock_details;
    if (!s?.expiry_date) return false;

    const exp = new Date(s.expiry_date);
    const today = new Date();
    today.setHours(0,0,0,0);

    return exp < today;
};

const getProductRowClass = (product) => {
    if (isExpired(product)) return "table-danger";
    if (isLowStock(product)) return "table-warning";
    return "";
};

const getStockStatus = (product) => {
    const s = product.stock_details;

    if (!s || s.quantity === 0) {
        return <Badge bg="secondary"><FaBan className="me-1" /> OUT</Badge>;
    }

    if (isExpired(product)) {
        return <Badge bg="danger"><FaExclamationTriangle className="me-1" /> EXPIRED</Badge>;
    }

    if (isLowStock(product)) {
        return <Badge bg="warning" text="dark"><FaExclamationTriangle className="me-1" /> LOW</Badge>;
    }

    return <Badge bg="success"><FaCheckCircle className="me-1" /> OK</Badge>;
};

export default ProductList;
