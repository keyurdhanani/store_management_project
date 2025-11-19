// store-management-frontend/src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';

import { 
    fetchDashboardStats, 
    fetchLowStockList, 
    fetchProfitMargins 
} from '../services/api';

// Icons
import { 
    FaBoxOpen, 
    FaChartLine, 
    FaDollarSign, 
    FaExclamationTriangle, 
    FaShoppingBag 
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [margins, setMargins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [marginLoading, setMarginLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Dashboard + Low Stock + Profit
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, lowStockRes, marginRes] = await Promise.all([
          fetchDashboardStats(),
          fetchLowStockList(),
          fetchProfitMargins(),
        ]);

        setStats(statsRes.data);
        setLowStockProducts(lowStockRes.data);
        setMargins(marginRes.data);

        setLoading(false);
        setMarginLoading(false);

      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError("Failed to fetch dashboard data. Check API.");
        setLoading(false);
        setMarginLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-2">Loading Dashboard Data...</p>
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

  return (
    <Container className="my-4">

      {/* ========================= */}
      {/* 📊 DASHBOARD OVERVIEW     */}
      {/* ========================= */}
      <h2 className="mb-4 text-primary">📊 Dashboard Overview</h2>


      {/* ========================= */}
      {/* ⚠️ LOW STOCK WARNING BAR  */}
      {/* ========================= */}
      {lowStockProducts.length > 0 && (
        <Alert variant="warning" className="d-flex align-items-center">
          <FaExclamationTriangle className="me-3 fs-4" />
          <div>
            <strong>Low Stock Alert!</strong> The following items are running low:
            <div className="mt-2">
              {lowStockProducts.map(p => (
                <span 
                  key={p.id} 
                  className="badge bg-warning text-dark me-2"
                >
                  {p.name} ({p.stock_details.quantity})
                </span>
              ))}
            </div>
          </div>
        </Alert>
      )}


      {/* ========================= */}
      {/* 🔢 METRIC CARDS           */}
      {/* ========================= */}
      <Row className="g-4 mb-4">

        {/* Total Products */}
        <Col md={4}>
          <Card className="text-center bg-white h-100 shadow">
            <Card.Body>
              <FaShoppingBag className="icon-large text-primary mb-3" size={45} />
              <Card.Title className="text-muted">Total Products</Card.Title>
              <Card.Text className="fs-2 fw-bold text-dark">{stats.total_products}</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Inventory Value */}
        <Col md={4}>
          <Card className="text-center bg-white h-100 shadow">
            <Card.Body>
              <FaDollarSign className="icon-large text-success mb-3" size={45} />
              <Card.Title className="text-muted">Total Inventory Value</Card.Title>
              <Card.Text className="fs-3 fw-bold text-dark">
                ₹ {stats.total_stock_value.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Revenue */}
        <Col md={4}>
          <Card className="text-center bg-white h-100 shadow">
            <Card.Body>
              <FaChartLine className="icon-large text-info mb-3" size={45} />
              <Card.Title className="text-muted">Revenue (Last 7 Days)</Card.Title>
              <Card.Text className="fs-3 fw-bold text-dark">
                ₹ {stats.recent_revenue.toLocaleString()}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

      </Row>



      {/* ============================= */}
      {/* 📉 LOW STOCK TABLE (DETAILED) */}
      {/* ============================= */}
      <h3 className="mt-4 text-danger"><FaExclamationTriangle className="me-2" /> Low Stock Items</h3>

      <Card className="shadow mb-4">
        <Card.Body>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No low stock items.
                  </td>
                </tr>
              ) : (
                lowStockProducts.map(product => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.category_name}</td>
                    <td>
                      <Badge bg="danger">{product.stock_details.quantity}</Badge>
                    </td>
                    <td>{product.stock_details.low_stock_threshold}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>



      {/* ========================= */}
      {/* 💰 DAILY PROFIT MARGINS   */}
      {/* ========================= */}
      <h3 className="mt-4 mb-3 text-secondary">💰 Daily Profit Margin</h3>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          {marginLoading ? (
            <div className="text-center">Loading Profit Data...</div>
          ) : (
            <Table striped hover responsive size="sm">
              <thead>
                <tr className="table-success">
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {margins.slice(0, 7).map((margin) => {
                  const pct = (margin.total_profit / margin.total_revenue) * 100 || 0;
                  return (
                    <tr key={margin.date}>
                      <td>{new Date(margin.date).toLocaleDateString()}</td>
                      <td>₹{parseFloat(margin.total_revenue).toFixed(2)}</td>
                      <td>₹{parseFloat(margin.total_cost).toFixed(2)}</td>
                      <td><strong>₹{parseFloat(margin.total_profit).toFixed(2)}</strong></td>
                      <td>{pct.toFixed(2)}%</td>
                    </tr>
                  );
                })}
                {margins.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No profit data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

    </Container>
  );
};

export default Dashboard;
