import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Card, Table, Modal, Spinner } from 'react-bootstrap';
import { 
    fetchProducts, 
    fetchSuppliers, 
    createPurchase, 
    fetchPurchases, 
    updatePurchase, 
    deletePurchase 
} from '../services/api'; // Ensure this path is correct

// --- Helper function to safely format dates for form fields (YYYY-MM-DD) ---
const formatDate = (dateString) => {
    if (!dateString) return '';
    // If dateString is already in YYYY-MM-DD format (like from the backend), use it.
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    // Convert from ISO/other format to YYYY-MM-DD
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        console.error("Date formatting failed for:", dateString, e);
        return '';
    }
};

// --- Nested Component: Handles the update logic within the Modal ---
const PurchaseEditForm = ({ initialData, onPurchaseUpdated, products, suppliers }) => {
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update state when initialData changes (i.e., when a new purchase is selected)
    useEffect(() => {
        // Use the initialData directly (which already has parsed/formatted fields from handleEditClick)
        setFormData(initialData); 
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 🚀 CRITICAL FIX: Ensure all fields are correctly parsed and sent as required by Django/DRF
        const dataToSend = {
            product: parseInt(formData.product),
            supplier: parseInt(formData.supplier),
            purchase_quantity: parseInt(formData.purchase_quantity),
            unit_purchase_price: parseFloat(formData.unit_purchase_price),
            invoice_number: formData.invoice_number || null,
            
            // 🚀 BATCH FIELDS: These are sent to the PurchaseSerializer which handles the Batch logic
            batch_number: formData.batch_number || '',
            // Send null or empty string if the date field is cleared/optional
            expiry_date: formData.expiry_date || null, 
        };

        try {
            await updatePurchase(initialData.id, dataToSend);
            onPurchaseUpdated(true); // Close modal and refresh
        } catch (err) {
            console.error("Update failed:", err.response ? err.response.data : err);
            // Provide specific error messages from the backend if available
            const errorMsg = err.response && err.response.data 
                ? JSON.stringify(err.response.data, null, 2) // Pretty print JSON errors
                : "Update failed. Check your input data.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleUpdate}>
            {error && <Alert variant="danger" style={{ whiteSpace: 'pre-wrap' }}>{error}</Alert>}
            
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Product</Form.Label>
                        <Form.Select 
                            name="product" 
                            // Ensure form value matches option value type (should be a number or string of number)
                            value={formData.product} 
                            onChange={handleChange} 
                            required
                        >
                            {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Supplier</Form.Label>
                        <Form.Select name="supplier" value={formData.supplier} onChange={handleChange} required>
                            {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="purchase_quantity" 
                            value={formData.purchase_quantity} 
                            onChange={handleChange} 
                            required 
                            min="1"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Unit Price (Cost)</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="unit_purchase_price" 
                            value={formData.unit_purchase_price} 
                            onChange={handleChange} 
                            required 
                            step="0.01"
                            min="0.01" 
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Batch Number</Form.Label>
                        <Form.Control
                            type="text"
                            name="batch_number"
                            value={formData.batch_number || ''} 
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Expiry Date (Optional)</Form.Label>
                        <Form.Control
                            type="date"
                            name="expiry_date"
                            // Use helper function to ensure date is in YYYY-MM-DD format for the input
                            value={formatDate(formData.expiry_date)}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mb-3">
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control 
                    type="text" 
                    name="invoice_number" 
                    value={formData.invoice_number || ''} 
                    onChange={handleChange} 
                />
            </Form.Group>

            <div className="d-flex justify-content-end">
                <Button variant="success" type="submit" disabled={loading}>
                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Saving...</> : 'Save Changes'}
                </Button>
            </div>
        </Form>
    );
};

// --- Main PurchaseManagement Component ---
const initialFormData = {
    product: '', 
    supplier: '',
    purchase_quantity: 1,
    unit_purchase_price: 0.01,
    batch_number: '', 
    expiry_date: '', 
    invoice_number: '',
};

const PurchaseManagement = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchases, setPurchases] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const loadPurchasesData = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                // Fetch all data concurrently
                const [suppliersRes, productsRes, purchasesRes] = await Promise.all([
                    fetchSuppliers(),
                    fetchProducts(),
                    fetchPurchases(),
                ]);

                const fetchedProducts = productsRes.data;
                const fetchedSuppliers = suppliersRes.data;

                setSuppliers(fetchedSuppliers);
                setProducts(fetchedProducts);
                setPurchases(purchasesRes.data);

                // Initialize form with the first available IDs only if the form isn't already populated
                setFormData(prev => ({ 
                    ...prev, 
                    product: prev.product || (fetchedProducts.length > 0 ? fetchedProducts[0].id : ''),
                    supplier: prev.supplier || (fetchedSuppliers.length > 0 ? fetchedSuppliers[0].id : ''),
                }));
            } catch (err) {
                console.error("Error loading purchase data:", err.response ? err.response.data : err);
                setErrorMessage("Failed to load products, suppliers, or purchase history. Check API connectivity.");
            } finally {
                setLoading(false);
            }
        };
        loadPurchasesData();
    }, [refreshKey]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setSuccessMessage(null); 
        setErrorMessage(null);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // 🚨 CRITICAL FIX: Ensure all fields are correctly parsed and sent
        const dataToSend = {
            ...formData,
            product: parseInt(formData.product),
            supplier: parseInt(formData.supplier),
            purchase_quantity: parseInt(formData.purchase_quantity),
            unit_purchase_price: parseFloat(formData.unit_purchase_price),
            // The API expects 'expiry_date' and 'batch_number' to be passed directly 
            batch_number: formData.batch_number,
            expiry_date: formData.expiry_date || null, // Send null if empty
            invoice_number: formData.invoice_number || null,
        };

        try {
            await createPurchase(dataToSend);
            setSuccessMessage("Purchase recorded successfully! Stock has been updated.");
            // Reset quantity/price/batch fields, keep product/supplier selected
            setFormData(prev => ({ 
                ...initialFormData, 
                product: prev.product, 
                supplier: prev.supplier 
            }));
            setRefreshKey(prev => prev + 1); 
        } catch (err) {
            console.error("Purchase entry failed:", err.response ? err.response.data : err);
            const errorData = err.response ? err.response.data : {};
            let msg = "Failed to record purchase. Check input data.";
            // Display specific field errors if available
            if (errorData.non_field_errors) {
                msg = errorData.non_field_errors.join(' ');
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                 msg = `Validation failed for: ${Object.keys(errorData).map(k => `${k}: ${errorData[k]}`).join(', ')}`;
            }
            setErrorMessage(msg);
        } finally {
            setLoading(false); 
        }
    };
    
    // 🚀 CRITICAL FIX: Populate batch details for editing
    const handleEditClick = (purchase) => {
        // Assume 'batch_created' is the nested object returned by the DRF PurchaseSerializer
        const batchDetails = purchase.batch_created || {}; 

        setSelectedPurchase({
            ...purchase,
            // Convert numbers/decimals to string for form compatibility
            unit_purchase_price: parseFloat(purchase.unit_purchase_price).toFixed(2),
            purchase_quantity: purchase.purchase_quantity.toString(),
            
            // Ensure Product/Supplier IDs are strings for the <Form.Select> components
            product: purchase.product.toString(),
            supplier: purchase.supplier.toString(),

            // 🚨 Batch Fields (Retrieved from nested object)
            batch_number: batchDetails.batch_number || '',
            expiry_date: batchDetails.expiry_date ? formatDate(batchDetails.expiry_date) : '',
        });
        setShowEditModal(true);
    };

    const handleDeleteClick = async (purchaseId, productName) => {
        if (window.confirm(`Are you sure you want to delete the purchase for ${productName}? Stock will be reversed. This action is irreversible.`)) {
            setErrorMessage(null);
            setSuccessMessage(null);
            try {
                await deletePurchase(purchaseId);
                setSuccessMessage(`Purchase for ${productName} deleted successfully!`);
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                console.error("Delete error:", error.response || error);
                const msg = error.response?.data?.detail || "Failed to delete purchase. This might be due to existing sales dependency or database constraints.";
                setErrorMessage(msg);
            }
        }
    };

    const handleEditClose = (needsRefresh = false) => {
        setShowEditModal(false);
        if (needsRefresh) {
            setRefreshKey(prev => prev + 1);
            setSuccessMessage(`Purchase ID ${selectedPurchase.id} updated successfully.`);
        }
        setSelectedPurchase(null);
    };
    
    if (loading && purchases.length === 0) {
        return <Container className="mt-5 text-center"><Spinner animation="border" /> Loading dependencies...</Container>;
    }

    const canSubmit = products.length > 0 && suppliers.length > 0 && formData.product && formData.supplier;

    return (
        <Container className="my-5">
            <h2 className="mb-4 text-info">📦 Inventory & Purchase Management</h2>
            
            {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger" className="mb-4">{errorMessage}</Alert>}

            <Row>
                <Col md={5}>
                    <Card className="p-4 shadow">
                        <h3 className="mb-4 text-success">💰 Record New Stock Purchase</h3>

                        <Form onSubmit={handleCreateSubmit}>
                            <Form.Group controlId="formProduct" className="mb-3">
                                <Form.Label>Product</Form.Label>
                                <Form.Select
                                    name="product"
                                    value={formData.product}
                                    onChange={handleChange}
                                    required
                                    disabled={!canSubmit && loading}
                                >
                                    <option value="">Select a Product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Form.Select>
                                {!products.length && <Alert variant="warning" className="mt-2">No products available. Please create one first.</Alert>}
                            </Form.Group>
                            
                            <Form.Group controlId="formSupplier" className="mb-3">
                                <Form.Label>Supplier</Form.Label>
                                <Form.Select
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    required
                                    disabled={!canSubmit && loading}
                                >
                                    <option value="">Select a Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </Form.Select>
                                {!suppliers.length && <Alert variant="warning" className="mt-2">No suppliers available. Please create one first.</Alert>}
                            </Form.Group>

                            <Row className="mb-3">
                                <Col md={6}>
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
                                <Col md={6}>
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
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group controlId="formBatch">
                                        <Form.Label>Batch Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="batch_number"
                                            value={formData.batch_number}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
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
                            </Row>

                            <Form.Group controlId="formInvoice" className="mb-3">
                                <Form.Label>Invoice Number (Optional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="invoice_number"
                                    value={formData.invoice_number}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-end mt-4">
                                <Button variant="success" type="submit" disabled={loading || !canSubmit}>
                                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Recording...</> : 'Record Purchase'}
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </Col>

                <Col md={7}>
                    <Card className="shadow-sm">
                        <Card.Header className="fw-bold bg-info text-white">Purchase History</Card.Header>
                        <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <Table striped hover size="sm">
                                <thead>
                                    <tr className="table-info">
                                        <th>Date</th><th>Product</th><th>Batch</th><th>Qty</th><th>Cost</th><th>Supplier</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map(purchase => (
                                        <tr key={purchase.id}>
                                            <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                                            <td><strong>{purchase.product_name}</strong></td>
                                            <td>{purchase.batch_created?.batch_number || 'N/A'}</td>
                                            <td>{purchase.purchase_quantity}</td>
                                            <td>₹{parseFloat(purchase.unit_purchase_price).toFixed(2)}</td>
                                            <td>{purchase.supplier_name}</td>
                                            <td>
                                                <Button variant="info" size="sm" className="me-2" onClick={() => handleEditClick(purchase)}>Edit</Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(purchase.id, purchase.product_name)}>Delete</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {purchases.length === 0 && <tr><td colSpan="7" className="text-center text-muted">No purchase records found.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {selectedPurchase && (
                <Modal show={showEditModal} onHide={() => handleEditClose(false)} size="lg">
                    <Modal.Header closeButton><Modal.Title>✏️ Edit Purchase: #{selectedPurchase.id}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <PurchaseEditForm 
                            initialData={selectedPurchase} 
                            onPurchaseUpdated={handleEditClose} 
                            products={products}
                            suppliers={suppliers}
                        />
                    </Modal.Body>
                </Modal>
            )}
        </Container>
    );
};

export default PurchaseManagement;