// store-management-frontend/src/components/auth/Login.jsx

import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { FaLock, FaUser, FaSignInAlt, FaStore } from 'react-icons/fa';

const Login = ({ switchToRegister }) => {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <Container 
      className="d-flex align-items-center justify-content-center" 
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)' }} // Custom gradient
    >
      <Card className="shadow-lg p-4 bg-white" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <div className="text-center mb-5">
            <FaStore size={48} className="text-primary mb-2" />
            <h2 className="text-primary fw-bold">Store POS Login</h2>
            <p className="text-muted">Access your inventory system</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <InputGroup>
                <InputGroup.Text><FaUser /></InputGroup.Text>
                <Form.Control 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Username"
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <InputGroup>
                <InputGroup.Text><FaLock /></InputGroup.Text>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Password"
                />
              </InputGroup>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3" 
              disabled={loading}
            >
              <FaSignInAlt className="me-2" />
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </Button>

            <div className="text-center mt-3">
                New user? <a href="#" onClick={switchToRegister}>Create an Account</a>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;