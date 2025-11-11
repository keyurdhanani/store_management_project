// store-management-frontend/src/components/MainLayout.jsx

import React from 'react';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import logo from '../assets/logo.png'; // <-- adjust path if needed

const MainLayout = ({ children, activeKey, setActiveKey }) => {
  return (
    <>
      {/* Top Navigation Bar */}
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
        <Container fluid>
          {/* Logo + Brand Name */}
          <Navbar.Brand href="#" className="fw-bold d-flex align-items-center">
            <Image
              src={logo}
              alt="Pharma & Glow Logo"
              width="45"
              height="45"
              roundedCircle
              className="me-2"
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
              >
                Dashboard
              </Nav.Link>
              <Nav.Link
                onClick={() => setActiveKey('products')}
                active={activeKey === 'products'}
              >
                Inventory
              </Nav.Link>
              <Nav.Link
                onClick={() => setActiveKey('purchases')}
                active={activeKey === 'purchases'}
              >
                Purchases
              </Nav.Link>
              <Nav.Link
                onClick={() => setActiveKey('sales')}
                active={activeKey === 'sales'}
              >
                Sales & Billing
              </Nav.Link>
              <Nav.Link
                onClick={() => setActiveKey('reports')}
                active={activeKey === 'reports'}
              >
                Reports
              </Nav.Link>
            </Nav>

            {/* User/Logout Section */}
            <Nav>
              <Nav.Link href="#" disabled className="text-light me-3">
                Welcome, Admin!
              </Nav.Link>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setActiveKey('login')}
              >
                Logout
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
