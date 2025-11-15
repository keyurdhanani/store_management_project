// store-management-frontend/src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { fetchDashboardStats, fetchLowStockList } from '../services/api';
import { FaBoxOpen, FaChartLine, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import { IoMdTime } from 'react-icons/io'; // Example icon for time/expiry

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          fetchDashboardStats(),
          fetchLowStockList(),
        ]);
        setStats(statsRes.data);
        setLowStock(lowStockRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard loading failed:", err);
        setError("Failed to fetch dashboard data. Check API status.");
        setLoading(false);
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
    <Container fluid className="my-4">
      <h2 className="mb-4 text-primary"><FaChartLine className="me-2" />Dashboard Overview</h2>

      {/* --- 1. STATS CARDS --- */}
      <Row className="g-4 mb-5">
        {/* Card 1: Total Products */}
        <Col md={3}>
          <DashboardCard 
            title="Total Products" 
            value={stats.total_products} 
            icon={FaBoxOpen} 
            bg="info" 
          />
        </Col>

        {/* Card 2: Total Inventory Value */}
        <Col md={3}>
          <DashboardCard 
            title="Total Stock Value (INR)" 
            value={`₹ ${stats.total_stock_value.toLocaleString()}`} 
            icon={FaDollarSign} 
            bg="primary" 
          />
        </Col>

        {/* Card 3: Recent Revenue */}
        <Col md={3}>
          <DashboardCard 
            title="Revenue (Last 7 Days)" 
            value={`₹ ${stats.recent_revenue.toLocaleString()}`} 
            icon={FaChartLine} 
            bg="success" 
          />
        </Col>

        {/* Card 4: Low Stock Alert */}
        <Col md={3}>
          <DashboardCard 
            title="Low Stock Items" 
            value={stats.low_stock_count} 
            icon={FaExclamationTriangle} 
            bg={stats.low_stock_count > 0 ? "danger" : "secondary"} 
          />
        </Col>
      </Row>

      {/* --- 2. LOW STOCK REPORT TABLE --- */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="bg-warning text-white fw-bold">
              <FaExclamationTriangle className="me-2" /> Low Stock Alert List
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">No items currently low on stock.</td></tr>
                  ) : (
                    lowStock.map(product => (
                      <tr key={product.id}>
                        <td>**{product.name}**</td>
                        <td>{product.category_name}</td>
                        <td><Badge bg="danger">{product.stock_details.quantity}</Badge></td>
                        <td>{product.stock_details.low_stock_threshold}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Helper Component for Dashboard Cards (for best UI with icons)
const DashboardCard = ({ title, value, icon: Icon, bg }) => (
    <Card bg={bg} text="white" className="shadow-sm border-0">
        <Card.Body>
            <Row className="align-items-center">
                <Col xs={3} className="text-center">
                    <Icon size={40} />
                </Col>
                <Col xs={9}>
                    <div className="text-uppercase fw-bold small">{title}</div>
                    <div className="h3 mb-0">{value}</div>
                </Col>
            </Row>
        </Card.Body>
    </Card>
);

export default Dashboard;