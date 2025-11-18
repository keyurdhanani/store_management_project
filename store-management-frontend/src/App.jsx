import React, { useState } from 'react';
import MainLayout from './components/MainLayout';
import ProductList from './components/ProductList';
import AddProductForm from './components/AddProductForm';
import SupplierManagement from './components/SupplierManagement';
import PurchaseEntryPage from './components/PurchaseEntryPage';
import BillingPOS from './components/BillingPOS';
import HistoryPage from './components/HistoryPage';
import Dashboard from './components/Dashboard';

import { Button, Container, Spinner } from 'react-bootstrap';
import { useAuth } from './context/AuthContext'; 
import Login from './components/auth/Login'; 
import './App.css'; 


function App() {
  const { user, logout, loading: authLoading } = useAuth();
  
  const [currentPage, setCurrentPage] = useState('dashboard'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(0);
  const [isRegisterMode, setIsRegisterMode] = useState(false); 
  const handleProductAdded = () => {
    setShowAddForm(false); 
    setRefreshProducts(prev => prev + 1); 
    setCurrentPage('products');
  };

  const handleSetPage = (pageKey) => {
    setCurrentPage(pageKey);
    setShowAddForm(false); 
  }

  const renderPage = () => {
    if (currentPage === 'dashboard') {
        return <Dashboard />;
    }
    
    if (currentPage === 'products' || showAddForm) {
      return (
        <Container className="my-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="text-secondary">Inventory Management</h1>
            <Button 
              variant={showAddForm ? "danger" : "success"}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '❌ Cancel Form' : '➕ Add New Product'}
            </Button>
          </div>

          {showAddForm ? (
            <AddProductForm 
              onProductAdded={handleProductAdded} 
              onCancel={() => setShowAddForm(false)} 
            />
          ) : (
            <ProductList key={refreshProducts} onAddProductClick={() => setShowAddForm(true)} />
          )}
        </Container>
      );
    }
    
    // --- 2. Purchases/Stock Management Router Container ---
    if (currentPage === 'purchases' || currentPage === 'supplier-management') {
      
      const isSupplierView = currentPage === 'supplier-management';
      
      return (
        <Container className="my-4">
          <h1 className="text-secondary">Purchasing & Stock In</h1>

          <div className="mb-4 d-flex">
            {/* Button to navigate to Supplier Management */}
            <Button 
              variant={isSupplierView ? "primary" : "outline-primary"} 
              className="me-2" 
              onClick={() => setCurrentPage('supplier-management')}
            >
              Manage Suppliers
            </Button>
            {/* Button to navigate to Purchase Entry (default 'purchases' route) */}
            <Button 
              variant={!isSupplierView ? "primary" : "outline-primary"} 
              onClick={() => setCurrentPage('purchases')}
            >
              Record Purchase
            </Button>
          </div>
            
          {isSupplierView ? <SupplierManagement /> : <PurchaseEntryPage />}
          
        </Container>
      );
    }
    
    // --- 3. Sales/Billing (Point of Sale) ---
    if (currentPage === 'sales') {
        return <BillingPOS />;
    }

    // --- 4. History ---
    if (currentPage === 'history') { 
        return <HistoryPage />;
    }

    // --- 5. Placeholder for other pages ---
    return (
      <Container className="mt-5 text-center">
        <h1 className="text-muted">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page</h1>
        <p className="lead">This feature is coming soon!</p>
      </Container>
    );
  };

  // ==========================================================
  // --- TOP-LEVEL AUTHENTICATION CHECK ---
  // ==========================================================
  
  if (authLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="secondary" /> 
        <p className="mt-2">Loading User...</p>
      </div>
    );
  }

  if (!user) {
    // Show Register component if in register mode
    if (isRegisterMode) {
      return <Register switchToLogin={() => setIsRegisterMode(false)} />;
    }
    // Default to Login component
    return <Login switchToRegister={() => setIsRegisterMode(true)} />;
  }

  // ==========================================================
  // --- AUTHENTICATED USER RENDERING ---
  // ==========================================================

  return (
    <div className="App">
      {/* MainLayout includes the navigation (like NavbarComponent)
        It receives the active page key and the navigation handler.
        It must also be updated to receive and display the user info and handle logout.
      */}
      <MainLayout 
        activeKey={currentPage} 
        setActiveKey={handleSetPage}
        onLogout={logout} // Pass logout function down
      >
        {renderPage()}
      </MainLayout>
    </div>
  );
}

export default App;