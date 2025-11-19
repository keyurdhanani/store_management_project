/* eslint-disable no-unused-vars */
// store-management-frontend/src/components/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import {
    Container, Card, Table, Spinner, Tabs, Tab, Alert, Button
} from 'react-bootstrap';

import {
    FaChartBar,
    FaMoneyBillWave,
    FaWarehouse,
    FaDownload,
    FaFileInvoiceDollar
} from 'react-icons/fa';

import { fetchProfitMargins, fetchSalesHistory, exportSalesCSV } from '../services/api';

const ReportsPage = () => {
    const [margins, setMargins] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const [marginRes, salesRes] = await Promise.all([
                    fetchProfitMargins(),
                    fetchSalesHistory()
                ]);

                setMargins(marginRes.data || []);
                setSales(salesRes.data || []);
                setLoading(false);

            } catch (err) {
                console.error(err);
                setError("Failed to load report data.");
                setLoading(false);
            }
        };

        loadReports();
    }, []);

    const handleExport = async () => {
        try {
            const res = await exportSalesCSV();

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', 'sales_report.csv');
            document.body.appendChild(link);

            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError("Failed to export CSV.");
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
                <p>Loading Reports...</p>
            </Container>
        );
    }

    return (
        <Container className="my-4">

            <h2 className="text-primary mb-4">
                <FaChartBar className="me-2" />
                Advanced Reporting
            </h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Tabs defaultActiveKey="profit" id="report-tabs" className="mb-4">

                {/* --- PROFIT TAB --- */}
                <Tab
                    eventKey="profit"
                    title={<span><FaMoneyBillWave className="me-2" /> Daily Profit Margins</span>}
                >
                    <Card className="shadow-sm">
                        <Card.Header className="bg-success text-white">
                            Last 30 Days Margin Overview
                        </Card.Header>

                        <Card.Body>
                            <Table striped bordered hover size="sm" responsive>
                                <thead>
                                    <tr className="table-success">
                                        <th>Date</th>
                                        <th>Revenue</th>
                                        <th>Cost (COGS)</th>
                                        <th>Net Profit</th>
                                        <th>Margin %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {margins.map((m) => {
                                        const revenue = parseFloat(m.total_revenue) || 0;
                                        const profit = parseFloat(m.total_profit) || 0;
                                        const percent = revenue ? (profit / revenue) * 100 : 0;

                                        return (
                                            <tr key={m.date}>
                                                <td>{new Date(m.date).toLocaleDateString()}</td>
                                                <td>₹{revenue.toFixed(2)}</td>
                                                <td>₹{parseFloat(m.total_cost).toFixed(2)}</td>
                                                <td>₹{profit.toFixed(2)}</td>
                                                <td>{percent.toFixed(2)}%</td>
                                            </tr>
                                        );
                                    })}

                                    {margins.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted">
                                                No margin data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* --- SALES EXPORT TAB --- */}
                <Tab
                    eventKey="sales-export"
                    title={<span><FaFileInvoiceDollar className="me-2" /> Sales History & Export</span>}
                >
                    <Card className="shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            Sales Records
                            <Button size="sm" variant="outline-primary" onClick={handleExport}>
                                <FaDownload className="me-2" /> Export All Sales (CSV)
                            </Button>
                        </Card.Header>

                        <Card.Body>
                            <Table striped bordered hover size="sm" responsive>
                                <thead>
                                    <tr className="table-primary">
                                        <th>Invoice No.</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Items</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {sales.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.invoice_number}</td>
                                            <td>{new Date(s.sale_date).toLocaleString()}</td>
                                            <td>{s.customer_name}</td>
                                            <td>₹{s.final_total}</td>
                                            <td>{(s.items ?? []).length}</td>
                                        </tr>
                                    ))}

                                    {sales.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted">
                                                No sales records available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* --- STOCK TAB --- */}
                <Tab
                    eventKey="stock"
                    title={<span><FaWarehouse className="me-2" /> Batch / Stock Report</span>}
                >
                    <Card className="shadow-sm">
                        <Card.Body>
                            <p className="text-muted">
                                Batch-wise stock report coming soon (Expiry, Stock Levels, Cost).
                            </p>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

        </Container>
    );
};

export default ReportsPage;
