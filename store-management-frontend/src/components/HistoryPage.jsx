// store-management-frontend/src/components/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Alert, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import { fetchSalesHistory, fetchPurchaseHistory, exportSalesCSV } from '../services/api';
import { FaDownload, FaHistory } from 'react-icons/fa';

const HistoryPage = () => {
  const [key, setKey] = useState('sales'); // Controls which tab is active
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [salesRes, purchasesRes] = await Promise.all([
          fetchSalesHistory(),
          fetchPurchaseHistory(),
        ]);
        setSales(salesRes.data);
        setPurchases(purchasesRes.data);
        setLoading(false);
      } catch (err) {
        console.error("History loading failed:", err);
        setError("Failed to fetch history data.");
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleExport = async () => {
    try {
      const response = await exportSalesCSV();

      // Create a link element, set its href to the blob URL, and click it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from Content-Disposition header (if provided by API) or use fallback
      link.setAttribute('download', 'sales_report.csv'); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export failed:", error);
      setError("Failed to generate and download CSV file.");
    }
  };


  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" variant="secondary" />
        <p className="mt-2">Loading Transaction History...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-secondary"><FaHistory className="me-2" /> Transaction History</h2>
        <Button variant="outline-success" onClick={handleExport}>
          <FaDownload className="me-2" /> Export Sales CSV
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        id="history-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        {/* --- Sales History Tab --- */}
        <Tab eventKey="sales" title="Sales Invoices">
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr className="table-success">
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>**{sale.invoice_number}**</td>
                  <td>{new Date(sale.sale_date).toLocaleString()}</td>
                  <td>{sale.customer_name}</td>
                  <td>
                    {sale.items.map(item => (
                        <div key={item.product}>{item.sold_quantity} x {item.product_name}</div>
                    ))}
                  </td>
                  <td>{sale.discount_rate}%</td>
                  <td><Badge bg="success">₹{sale.final_total}</Badge></td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No sales records found.</td></tr>}
            </tbody>
          </Table>
        </Tab>

        {/* --- Purchase History Tab --- */}
        <Tab eventKey="purchases" title="Stock Purchases">
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr className="table-info">
                <th>Date</th>
                <th>Product</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Invoice No.</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{new Date(purchase.purchase_date).toLocaleString()}</td>
                  <td>**{purchase.product_name}**</td>
                  <td>{purchase.supplier_name}</td>
                  <td>{purchase.purchase_quantity}</td>
                  <td>₹{purchase.unit_purchase_price}</td>
                  <td>{purchase.invoice_number || 'N/A'}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan="6" className="text-center text-muted">No purchase records found.</td></tr>}
            </tbody>
          </Table>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default HistoryPage;