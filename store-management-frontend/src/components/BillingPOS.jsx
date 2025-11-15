// store-management-frontend/src/components/BillingPOS.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, InputGroup, Badge } from 'react-bootstrap';
import { fetchProducts, createSaleInvoice } from '../services/api';

const BillingPOS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate] = useState(5);
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- Load products ---
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetchProducts();
        setProducts(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError("Failed to load product data for billing.");
      }
    };
    loadProducts();
  }, []);

  // --- Filter products ---
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Cart Management ---
  const addToCart = (product) => {
    setError(null);
    const availableStock = parseInt(product.stock_details.quantity) || 0;

    if (availableStock <= 0) {
      setError(`Product ${product.name} is Out of Stock.`);
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > availableStock) {
        setError(`Only ${availableStock} units of ${product.name} left in stock.`);
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    setError(null);
    const productData = products.find(p => p.id === productId);
    const maxQty = parseInt(productData.stock_details.quantity) || 0;

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else if (newQuantity > maxQty) {
      setError(`Cannot exceed stock limit of ${maxQty} for ${productData.name}.`);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // --- Billing calculations ---
  const calculateTotals = () => {
    let subtotal = cart.reduce((acc, item) => {
      const price = parseFloat(item.product.base_price) || 0;
      return acc + price * item.quantity;
    }, 0);

    subtotal = parseFloat(subtotal.toFixed(2));
    const discountAmount = parseFloat((subtotal * (discountRate / 100)).toFixed(2));
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = parseFloat((discountedSubtotal * (taxRate / 100)).toFixed(2));
    const finalTotal = parseFloat((discountedSubtotal + taxAmount).toFixed(2));

    return { subtotal, discountAmount, taxAmount, finalTotal };
  };

  const totals = calculateTotals();

  // --- Checkout ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("The cart is empty. Cannot process sale.");
      return;
    }

    setError(null);
    setSuccess(null);

    const invoiceData = {
      customer_name: customerName || 'Cash Customer',
      discount_rate: parseFloat(discountRate) || 0,
      tax_rate: parseFloat(taxRate) || 0,
      items: cart.map(item => ({
        product: item.product.id,
        sold_quantity: parseInt(item.quantity),
        unit_sale_price: parseFloat(item.product.base_price),
      })),
    };

    try {
      const response = await createSaleInvoice(invoiceData);
      setSuccess(`✅ Sale successful! Invoice #${response.data.invoice_number}`);

      // Reset cart
      setCart([]);
      setSearchTerm('');
      setDiscountRate(0);
      setCustomerName('');
    } catch (err) {
      console.error("Checkout failed:", err.response?.data || err);
      if (err.response && err.response.data) {
        setError(`Sale failed: ${JSON.stringify(err.response.data)}`);
      } else {
        setError("Sale failed. Check API connection or server logs.");
      }
    }
  };

  // --- Render ---
  return (
    <Container fluid className="my-4">
      <Row>
        {/* Left Panel: Products */}
        <Col md={7}>
          <Card className="shadow-lg p-3">
            <h3 className="text-info mb-3">🔍 Quick Search & Inventory</h3>
            <Form.Group className="mb-3">
              <Form.Control
                type="search"
                placeholder="Search product by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="lg"
              />
            </Form.Group>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead>
                  <tr className="table-primary">
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>₹{parseFloat(product.base_price).toFixed(2)}</td>
                      <td>
                        <Badge bg={product.stock_details.quantity > product.stock_details.low_stock_threshold ? "success" : "warning"}>
                          {product.stock_details.quantity}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.stock_details.quantity <= 0}
                        >
                          <i className="bi bi-cart-plus"></i> Add
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>

        {/* Right Panel: Cart & Billing */}
        <Col md={5}>
          <Card className="shadow-lg p-3 sticky-top" style={{ top: '15px' }}>
            <h3 className="text-success mb-3">🛒 Sales Cart</h3>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

            <Table bordered size="sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th width="15%">Qty</th>
                  <th width="20%">Price</th>
                  <th width="10%"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="4" className="text-center text-muted">Cart is empty.</td></tr>
                ) : (
                  cart.map(item => (
                    <tr key={item.product.id}>
                      <td>{item.product.name}</td>
                      <td>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          min="1"
                          max={item.product.stock_details.quantity}
                          onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                          size="sm"
                        />
                      </td>
                      <td>₹{(parseFloat(item.product.base_price) * item.quantity).toFixed(2)}</td>
                      <td>
                        <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.product.id)}>
                          X
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <hr />

            {/* Customer & Discount */}
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Discount (%)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Math.min(100, Math.max(0, parseFloat(e.target.value))))}
                  min="0"
                  max="100"
                  step="1"
                />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            {/* Totals */}
            <Table className="mt-4 fw-bold">
              <tbody>
                <tr><td>Subtotal:</td><td className="text-end">₹{totals.subtotal.toFixed(2)}</td></tr>
                <tr><td>Discount ({discountRate}%):</td><td className="text-end text-danger">- ₹{totals.discountAmount.toFixed(2)}</td></tr>
                <tr><td>Tax ({taxRate}%):</td><td className="text-end">₹{totals.taxAmount.toFixed(2)}</td></tr>
                <tr className="table-success fs-5">
                  <td>FINAL TOTAL:</td>
                  <td className="text-end">₹{totals.finalTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </Table>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="mt-3"
            >
              FINALIZE SALE & PRINT BILL
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BillingPOS;
