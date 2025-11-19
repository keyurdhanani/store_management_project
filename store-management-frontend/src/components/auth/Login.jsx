import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
// The original import for 'react-icons/fa' is removed to resolve the build error.
// Icons are now defined as functional components using inline SVGs for portability.

// --- Icon Definitions using Inline SVG ---

const IconBoxOpen = ({ size = 48, className = '' }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14 2h6v6"></path>
    <path d="M22 12V6l-6-6H4a2 2 0 0 0-2 2v17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
    <path d="M22 12h-4a2 2 0 0 0-2 2v3"></path>
    <line x1="6" y1="10" x2="10" y2="10"></line>
    <line x1="10" y1="14" x2="14" y2="14"></line>
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const IconSignIn = ({ className = '' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const IconEyeSlash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.16 0-9.55-3.88-11-8 1.45-4.12 5.84-8 11-8 1.4 0 2.8.4 4.1.95M2.5 2.5l19 19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

// --- Login Component ---

const Login = () => {
  // NOTE: The AuthContext import path cannot be fixed from this file, 
  // but the application assumes it exists at this path.
  const { login, loading, error } = useAuth(); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // For password visibility

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <Container 
      fluid 
      className="d-flex align-items-center justify-content-center" 
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)' // Custom gradient background
      }}
    >
      <Row className="justify-content-center w-100">
        <Col xs={11} sm={9} md={7} lg={5} xl={4}>
          <Card className="shadow-2xl p-4 p-md-5 text-center rounded-lg">
            <Card.Body>
              {/* Replaced FaBoxOpen with IconBoxOpen */}
              <IconBoxOpen size={48} className="icon-large mb-4 text-primary" /> 
              <h2 className="text-primary fw-bold mb-2">Welcome Back!</h2>
              <p className="text-muted mb-4">Log in to manage your inventory</p>

              {error && <Alert variant="danger" className="text-start">{error}</Alert>}

              <Form onSubmit={handleSubmit} className="text-start">
                {/* Username Input */}
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="small fw-bold">Username</Form.Label>
                  <InputGroup>
                    {/* Replaced FaUser with IconUser */}
                    <InputGroup.Text><IconUser /></InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      required 
                      placeholder="Enter your username"
                    />
                  </InputGroup>
                </Form.Group>

                {/* Password Input with Visibility Toggle */}
                <Form.Group className="mb-4" controlId="password">
                  <Form.Label className="small fw-bold">Password</Form.Label>
                  <InputGroup>
                    {/* Replaced FaLock with IconLock */}
                    <InputGroup.Text><IconLock /></InputGroup.Text>
                    <Form.Control 
                      type={showPassword ? "text" : "password"} // Toggle password visibility
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      placeholder="Enter your password"
                    />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)} title="Toggle Password Visibility">
                      {/* Replaced FaEye and FaEyeSlash with IconEye and IconEyeSlash */}
                      {showPassword ? <IconEyeSlash /> : <IconEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                {/* Login Button */}
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2 mb-3 fw-bold shadow-md hover:shadow-lg transition-shadow duration-300" 
                  disabled={loading}
                >
                  {/* Replaced FaSignInAlt with IconSignIn */}
                  <IconSignIn className="me-2" />
                  {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                </Button>

                
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;