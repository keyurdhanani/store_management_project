// store-management-frontend/src/App.jsx

import React, { useState } from 'react';
import MainLayout from './components/MainLayout';
import ProductList from './components/ProductList';
import AddProductForm from './components/AddProductForm';
import { Button, Container } from 'react-bootstrap';
import './App.css'; 

function App() {
  // 'products', 'addProduct', 'dashboard', 'purchases', etc.
  const [currentPage, setCurrentPage] = useState('products'); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshProducts, setRefreshProducts] = useState(0); // Key to force ProductList reload

  const handleProductAdded = () => {
    setShowAddForm(false); // Close the form
    setRefreshProducts(prev => prev + 1); // Trigger refresh in ProductList
    setCurrentPage('products'); // Switch back to the list
  };

  // Function to render the correct component based on state
  const renderPage = () => {
    if (currentPage === 'products' || showAddForm) {
        // Inventory Management View
        return (
            <Container className="my-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="text-secondary">Inventory Management</h1>
                    <Button 
                        variant={showAddForm ? "danger" : "success"}
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? 'Cancel Form' : '➕ Add New Product'}
                    </Button>
                </div>

                {showAddForm ? (
                    <AddProductForm 
                        onProductAdded={handleProductAdded} 
                        onCancel={() => setShowAddForm(false)} 
                    />
                ) : (
                    // Pass the refresh key to force re-render when a new product is added
                    <ProductList key={refreshProducts} />
                )}
            </Container>
        );
    }

    // Simple placeholder for other pages
    return (
        <Container className="mt-5 text-center">
            <h1 className="text-muted">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page</h1>
            <p className="lead">This feature is coming soon!</p>
        </Container>
    );
  };

  return (
    <div className="App">
      <MainLayout activeKey={currentPage} setActiveKey={setCurrentPage}>
        {renderPage()}
      </MainLayout>
    </div>
  );
}

export default App;