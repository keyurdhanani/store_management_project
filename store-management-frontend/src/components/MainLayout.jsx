import React from 'react';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import logo from '../assets/logo.png'; 
import { useAuth } from '../context/AuthContext';

// Icons
import { 
    FaTachometerAlt, FaBoxes, FaShoppingCart, FaChartBar, 
    FaSignOutAlt, FaReceipt, FaHistory, FaStore 
} from 'react-icons/fa';

const MainLayout = ({ children, activeKey, setActiveKey }) => {
    const { user, logout } = useAuth();

    // Helper component for consistent navigation links
    // eslint-disable-next-line no-unused-vars
    const NavLinkItem = ({ eventKey, icon: Icon, text }) => (
        <Nav.Link 
            onClick={() => setActiveKey(eventKey)}
            active={activeKey === eventKey}
            className="d-flex align-items-center me-3"
        >
            <Icon className="me-2" /> {text}
        </Nav.Link>
    );

    return (
        <>
            {/* TOP NAVBAR */}
            <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-lg">
                <Container fluid className="px-md-5">
                    <Navbar.Brand 
                        onClick={() => setActiveKey('dashboard')} 
                        className="fw-bold d-flex align-items-center cursor-pointer"
                    >
                        <Image
                            src={logo}
                            alt="Pharma & Glow Logo"
                            width="45"
                            height="45"
                            roundedCircle
                            className="me-2 border border-2 border-white"
                        />
                        <FaStore className="me-2" />
                        Pharma & Glow
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                    <Navbar.Collapse id="responsive-navbar-nav">
                        
                        {/* LEFT NAVIGATION */}
                        <Nav className="mx-auto"> 
                            <NavLinkItem 
                                eventKey="dashboard" 
                                icon={FaTachometerAlt} 
                                text="Dashboard" 
                            />
                            <NavLinkItem 
                                eventKey="products" 
                                icon={FaBoxes} 
                                text="Inventory" 
                            />
                            <NavLinkItem 
                                eventKey="purchases" 
                                icon={FaShoppingCart} 
                                text="Purchases" 
                            />
                            <NavLinkItem 
                                eventKey="sales" 
                                icon={FaReceipt} 
                                text="Sales & Billing" 
                            />
                            <NavLinkItem 
                                eventKey="reports" 
                                icon={FaChartBar} 
                                text="Reports" 
                            />
                            <NavLinkItem 
                                eventKey="history" 
                                icon={FaHistory} 
                                text="History" 
                            />
                        </Nav>

                        {/* RIGHT SIDE: USER + LOGOUT */}
                        <Nav className="ms-auto">
                            <Nav.Link disabled className="text-light me-3 d-none d-lg-block">
                                Welcome, <strong>{user?.username || "Admin"}</strong>!
                            </Nav.Link>

                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={logout}
                                className="d-flex align-items-center fw-bold px-3"
                            >
                                <FaSignOutAlt className="me-2" /> Logout
                            </Button>
                        </Nav>

                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* MAIN CONTENT */}
            <Container fluid className="p-0">
                {children}
            </Container>
        </>
    );
};

export default MainLayout;