import React, { useState } from 'react';
import MainLayout from './components/MainLayout';
import ProductList from './components/ProductList';
import AddProductForm from './components/AddProductForm';
import SupplierManagement from './components/SupplierManagement';
import { Button, Container } from 'react-bootstrap';
import PurchaseEntryPage from './components/PurchaseEntryPage';
import BillingPOS from './components/BillingPOS';
import './App.css'; 
import Dashboard from './components/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('products'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(0);

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
    // --- 1. Inventory Management (Products/AddProduct) ---
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
            // Pass the refresh key to force re-render when a new product is added
            <ProductList key={refreshProducts} onAddProductClick={() => setShowAddForm(true)} />
          )}
        </Container>
      );
    }
    if (currentPage === 'dashboard') {
        return <Dashboard />;
    }
    
    if (currentPage === 'products' || showAddForm) {
        // ... existing Inventory Management code
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

    // --- 4. Placeholder for other pages ---
    return (
      <Container className="mt-5 text-center">
        {/* Format the current page name for display */}
        <h1 className="text-muted">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page</h1>
        <p className="lead">This feature is coming soon!</p>
      </Container>
    );

    

  };

  return (
    <div className="App">
      <MainLayout activeKey={currentPage} setActiveKey={handleSetPage}>
        {renderPage()}
      </MainLayout>
    </div>
  );
}

export default App;