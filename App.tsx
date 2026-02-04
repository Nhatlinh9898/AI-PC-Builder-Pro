import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Builder from './pages/Builder';
import PriceDashboard from './pages/PriceDashboard';
import Marketplace from './pages/Marketplace';
import CategoryPage from './pages/CategoryPage';
import ProductArchitect from './pages/ProductArchitect';
import { BuildProvider } from './context/BuildContext';

const App: React.FC = () => {
  return (
    <BuildProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/dashboard" element={<PriceDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/architect" element={<ProductArchitect />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </BuildProvider>
  );
};

export default App;