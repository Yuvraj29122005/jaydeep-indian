import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import RefillTracking from './pages/RefillTracking';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<CreateInvoice />} />
        <Route path="/invoices/edit/:id" element={<CreateInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/refill" element={<RefillTracking />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

