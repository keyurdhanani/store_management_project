/* eslint-disable no-unused-vars */
// store-management-frontend/src/components/BillingPOS.jsx

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Form, Button,
  Table, Alert, InputGroup, Badge
} from 'react-bootstrap';

import {
  FaSearch, FaPlusCircle, FaShoppingCart,
  FaCashRegister, FaUser, FaPercentage, FaBox
} from 'react-icons/fa';

import { fetchProducts, fetchProductDetail, createSaleInvoice } from '../services/api';

const initialFormData = {
  product: '',
  batch: '',
  quantity: 1,
  unit_sale_price: 0,
};

const BillingPOS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const { product, batch, quantity, unit_sale_price } = formData;

  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate] = useState(5);
  const [customerName, setCustomerName] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetchProducts();
        const processed = response.data.map(p => ({
          ...p,
          mrp: parseFloat(p.mrp) || 0
        }));
        setProducts(processed);
      } catch (err) {
        setError("Failed to load products.");
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numeric = (name === 'quantity' || name === 'unit_sale_price')
      ? parseFloat(value) || 0
      : value;

    setFormData(prev => ({ ...prev, [name]: numeric }));
    setError(null);
  };

  const handleDiscountChange = (e) => {
    const v = parseFloat(e.target.value) || 0;
    setDiscountRate(v);
  };

  const handleProductSelect = async (productId) => {
    const prod = products.find(p => p.id === parseInt(productId));
    if (!prod) return;

    if (selectedProductDetails?.id === prod.id) {
      setFormData(prev => ({
        ...prev,
        product: productId,
        unit_sale_price: selectedProductDetails.mrp
      }));
      return;
    }

    setSelectedProductDetails(null);
    setFormData({ product: productId, batch: '', quantity: 1, unit_sale_price: 0 });

    try {
      const res = await fetchProductDetail(productId);
      const processed = { ...res.data, mrp: parseFloat(res.data.mrp) || 0 };
      setSelectedProductDetails(processed);

      setFormData(prev => ({
        ...prev,
        unit_sale_price: processed.mrp
      }));
    } catch (err) {
      setError("Error loading product details.");
    }
  };

  const handleAddItemToCart = () => {
    const qty = parseFloat(quantity);
    const price = parseFloat(unit_sale_price);

    if (!product || !batch || qty <= 0 || price <= 0) {
      setError("Enter valid product, batch, qty, and price.");
      return;
    }

    const detail = selectedProductDetails;
    const batchId = parseInt(batch);
    const selectedBatch = detail.active_batches.find(b => b.id === batchId);

    if (!selectedBatch) {
      setError("Invalid batch.");
      return;
    }

    if (qty > selectedBatch.quantity) {
      setError(`Only ${selectedBatch.quantity} units left.`);
      return;
    }

    setCart(prev => [
      ...prev,
      {
        product_id: detail.id,
        product_name: detail.name,
        batch_id: batchId,
        batch_number: selectedBatch.batch_number,
        expiry_date: selectedBatch.expiry_date,
        quantity: qty,
        price,
        total: qty * price
      }
    ]);

    // Update UI stock quickly
    setSelectedProductDetails(prev => ({
      ...prev,
      active_batches: prev.active_batches.map(b =>
        b.id === batchId ? { ...b, quantity: b.quantity - qty } : b
      )
    }));

    setFormData(initialFormData);
    setError(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Cart empty.");
      return;
    }

    const invoiceData = {
      customer_name: customerName || "Cash Customer",
      discount_rate: discountRate,
      tax_rate: taxRate,
      items: cart.map(item => ({
        product: item.product_id,
        batch: item.batch_id,
        sold_quantity: item.quantity,
        unit_sale_price: item.price
      }))
    };

    try {
      const res = await createSaleInvoice(invoiceData);
      setSuccess(`Sale successful. Invoice #${res.data.invoice_number}`);

      setCart([]);
      setCustomerName('');
      setDiscountRate(0);
      setSelectedProductDetails(null);

      const updated = await fetchProducts();
      setProducts(updated.data.map(p => ({ ...p, mrp: parseFloat(p.mrp) || 0 })));

    } catch (err) {
      setError("Sale failed. Check details.");
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discAmt = subtotal * (discountRate / 100);
  const subAfterDisc = subtotal - discAmt;
  const taxAmt = subAfterDisc * (taxRate / 100);
  const finalTotal = subAfterDisc + taxAmt;

  return (
    <Container fluid className="my-4">

      <Row>

        {/* LEFT SIDE - PRODUCT SEARCH */}
        <Col md={6}>
          <Card className="shadow-lg p-3">
            <h4 className="text-primary">
              <FaSearch className="me-2" /> Search Products
            </h4>

            <InputGroup className="my-3">
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <Table hover bordered>
                <thead className="table-primary">
                  <tr>
                    <th>Name</th>
                    <th>MRP</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => handleProductSelect(p.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{p.name}</td>
                      <td>₹{p.mrp.toFixed(2)}</td>
                      <td>
                        <Badge bg={p.stock_details?.quantity > 0 ? "success" : "danger"}>
                          {p.stock_details?.quantity || 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>

        {/* RIGHT SIDE - BILLING */}
        <Col md={6}>

          {/* Add Item Panel */}
          <Card className="shadow-lg p-3 mb-4">
            <h4 className="text-success">
              <FaPlusCircle className="me-2" /> Add Item to Cart
            </h4>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row className="mt-3">

              <Col md={5}>
                <Form.Group>
                  <Form.Label><FaBox className="me-2" />Product</Form.Label>
                  <Form.Select
                    name="product"
                    value={product}
                    onChange={(e) => handleProductSelect(e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label><FaBox className="me-2" />Batch</Form.Label>
                  <Form.Select
                    name="batch"
                    value={batch}
                    onChange={handleChange}
                    disabled={!selectedProductDetails}
                  >
                    <option value="">Select Batch</option>
                    {selectedProductDetails?.active_batches?.map(b =>
                      b.quantity > 0 && (
                        <option key={b.id} value={b.id}>
                          {b.batch_number} - Qty {b.quantity}
                        </option>
                      )
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Qty</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity.toString()}
                    name="quantity"
                    onChange={handleChange}
                    disabled={!batch}
                  />
                </Form.Group>
              </Col>

              <Col md={5} className="mt-3">
                <Form.Group>
                  <Form.Label>
                    Price (MRP: ₹{selectedProductDetails?.mrp?.toFixed(2) || 'N/A'})
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="unit_sale_price"
                    value={(parseFloat(unit_sale_price) || 0).toFixed(2)}
                    onChange={handleChange}
                    disabled={!product}
                  />
                </Form.Group>
              </Col>

            </Row>

            <Button
              className="mt-3"
              variant="primary"
              onClick={handleAddItemToCart}
              disabled={!product || !batch}
            >
              <FaShoppingCart className="me-2" /> Add to Cart
            </Button>
          </Card>

          {/* CART */}
          <Card className="shadow-lg p-3 mb-4">
            <h4><FaShoppingCart className="me-2" />Cart</h4>

            <Table bordered size="sm">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">Cart is empty</td></tr>
                ) : cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product_name}</td>
                    <td>{item.batch_number}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* TOTAL PANEL */}
          <Card className="shadow-lg p-3">
            <h4><FaCashRegister className="me-2" /> Billing Summary</h4>

            <Form.Group className="my-3">
              <Form.Label><FaUser className="me-2" />Customer Name</Form.Label>
              <Form.Control
                placeholder="Cash Customer"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label><FaPercentage className="me-2" />Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={discountRate}
                    min="0"
                    max="100"
                    onChange={handleDiscountChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tax (%)</Form.Label>
                  <Form.Control readOnly value={taxRate} />
                </Form.Group>
              </Col>
            </Row>

            <Table className="mt-3">
              <tbody>
                <tr><td>Subtotal:</td><td className="text-end">₹{subtotal.toFixed(2)}</td></tr>
                <tr><td>Discount:</td><td className="text-end">- ₹{discAmt.toFixed(2)}</td></tr>
                <tr><td>Tax:</td><td className="text-end">+ ₹{taxAmt.toFixed(2)}</td></tr>
                <tr className="fw-bold fs-5 table-light">
                  <td>Total:</td>
                  <td className="text-end">₹{finalTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>

            <Button
              className="mt-3 w-100"
              variant="success"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              <FaCashRegister className="me-2" /> Finalize Sale
            </Button>
          </Card>

        </Col>
      </Row>

    </Container>
  );
};

export default BillingPOS;
