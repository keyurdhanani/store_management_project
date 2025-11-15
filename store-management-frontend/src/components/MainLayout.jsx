// store-management-frontend/src/components/MainLayout.jsx

import React from 'react';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import logo from '../assets/logo.png'; // <-- adjust path if needed
// Import icons
import { FaTachometerAlt, FaBoxes, FaShoppingCart, FaChartBar, FaSignOutAlt, FaReceipt } from 'react-icons/fa';

// Use bg="dark" and variant="dark" for a cleaner, modern look, or keep primary.
const MainLayout = ({ children, activeKey, setActiveKey }) => {
    return (
        <>
            {/* Top Navigation Bar: Changed bg="primary" to bg="dark" for contrast */}
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-lg">
                <Container fluid>
                    {/* Logo + Brand Name */}
                    <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
                        <Image
                            src={logo}
                            alt="Pharma & Glow Logo"
                            width="45"
                            height="45"
                            roundedCircle
                            className="me-2 border border-2 border-white" // Added border
                        />
                        Pharma & Glow
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        {/* Main Navigation Links */}
                        <Nav className="me-auto">
                            <Nav.Link
                                onClick={() => setActiveKey('dashboard')}
                                active={activeKey === 'dashboard'}
                                className="d-flex align-items-center"
                            >
                                <FaTachometerAlt className="me-2" /> Dashboard
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => setActiveKey('products')}
                                active={activeKey === 'products'}
                                className="d-flex align-items-center"
                            >
                                <FaBoxes className="me-2" /> Inventory
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => setActiveKey('purchases')}
                                active={activeKey === 'purchases'}
                                className="d-flex align-items-center"
                            >
                                <FaShoppingCart className="me-2" /> Purchases
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => setActiveKey('sales')}
                                active={activeKey === 'sales'}
                                className="d-flex align-items-center"
                            >
                                <FaReceipt className="me-2" /> Sales & Billing
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => setActiveKey('reports')}
                                active={activeKey === 'reports'}
                                className="d-flex align-items-center"
                            >
                                <FaChartBar className="me-2" /> Reports
                            </Nav.Link>
                        </Nav>

                        {/* User/Logout Section */}
                        <Nav>
                            <Nav.Link href="#" disabled className="text-light me-3">
                                Welcome, **Admin**!
                            </Nav.Link>
                            <Button
                                variant="outline-danger" // Used 'danger' to signify logout action
                                size="sm"
                                onClick={() => setActiveKey('login')}
                            >
                                <FaSignOutAlt className="me-2" /> Logout
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main Content Area */}
            <Container fluid className="p-0">
                {children}
            </Container>
        </>
    );
};

export default MainLayout;