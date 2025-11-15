// store-management-frontend/src/components/ProductList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Container, Button, Alert, Row, Col, Badge, Modal } from 'react-bootstrap';
import { fetchProducts, deleteProduct } from '../services/api'; 
import AddProductForm from './AddProductForm'; 
import { FaPlus, FaPencilAlt, FaTrash, FaBoxOpen, FaExclamationTriangle, FaCheckCircle, FaBan } from 'react-icons/fa';

const ProductList = ({ onAddProductClick }) => {
    // --- State Initialization ---
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); 
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    
    // --- Data Loading Logic ---
    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchProducts();
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load product data. Check API server status.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts, refreshKey]);

    // --- Event Handlers ---
    
    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setShowEditModal(true);
    };

    const handleDeleteClick = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete the product: ${productName}? This action is irreversible.`)) {
            try {
                await deleteProduct(productId); 
                setRefreshKey(prev => prev + 1);
                setSuccessMessage(`Product **${productName}** deleted successfully!`);
                setTimeout(() => setSuccessMessage(null), 3000);
            } catch (error) {
                console.error("Error deleting product:", error);
                setErrorMessage("Failed to delete product. It might be linked to existing sales/purchases.");
                setTimeout(() => setErrorMessage(null), 5000);
            }
        }
    };

    const handleEditClose = (needsRefresh = false) => {
        setShowEditModal(false);
        setSelectedProduct(null);
        if (needsRefresh) {
            setRefreshKey(prev => prev + 1); 
        }
    };
    
    // --- Render Logic ---
    if (loading) {
        return <Container className="mt-5 text-center"><FaBoxOpen className="fa-spin me-2" /> Loading products...</Container>;
    }

    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container className="mt-4">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="text-secondary fw-light">📦 Inventory Stock</h2>
                </Col>
                <Col className="text-end">
                    <Button variant="success" onClick={onAddProductClick}>
                        <FaPlus className="me-2" /> Add New Product
                    </Button>
                </Col>
            </Row>
            
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            
            <Table striped bordered hover responsive className="shadow-sm">
                <thead>
                    <tr className="table-primary">
                        <th>#</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price (₹)</th>
                        <th>Stock Qty</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={product.id} className={getProductRowClass(product)}>
                            <td>{index + 1}</td>
                            <td>**{product.name}**</td>
                            <td>{product.category_name}</td>
                            <td>{product.base_price}</td>
                            <td>
                                <span className={isLowStock(product) ? 'fw-bold text-danger' : ''}>
                                    {product.stock_details.quantity}
                                </span>
                            </td>
                            <td>
                                <span className={isExpired(product) ? 'fw-bold text-danger' : ''}>
                                    {product.stock_details.expiry_date || 'N/A'}
                                </span>
                            </td>
                            <td>{getStockStatus(product)}</td>
                            <td>
                                <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleEditClick(product)}>
                                    <FaPencilAlt />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(product.id, product.name)}>
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {products.length === 0 && (
                        <tr>
                            <td colSpan="8" className="text-center text-muted py-3">
                                <FaBan className="me-2" /> No products found. Time to stock up!
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
            
            {/* Product Edit Modal */}
            {selectedProduct && (
                <Modal show={showEditModal} onHide={() => handleEditClose(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>✏️ Edit Product: {selectedProduct.name}</Modal.Title>
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

// --- Helper Functions ---

const isLowStock = (product) => {
    const stock = product.stock_details;
    return stock.quantity <= stock.low_stock_threshold && stock.quantity > 0;
}

const isExpired = (product) => {
    if (!product.stock_details.expiry_date) return false;
    const expiryDate = new Date(product.stock_details.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate < today; 
}

const getProductRowClass = (product) => {
    if (isExpired(product)) return 'table-danger';
    if (isLowStock(product)) return 'table-warning';
    return '';
}

const getStockStatus = (product) => {
    if (isExpired(product)) return <Badge bg="danger" className="p-2"><FaExclamationTriangle className="me-1" /> EXPIRED</Badge>;
    if (isLowStock(product)) return <Badge bg="warning" text="dark" className="p-2"><FaExclamationTriangle className="me-1" /> LOW STOCK</Badge>;
    if (product.stock_details.quantity === 0) return <Badge bg="secondary" className="p-2"><FaBan className="me-1" /> OUT OF STOCK</Badge>;
    return <Badge bg="success" className="p-2"><FaCheckCircle className="me-1" /> In Stock</Badge>;
}

export default ProductList;