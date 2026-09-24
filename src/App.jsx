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
import PersonalNotes from './pages/PersonalNotes';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function ModuleGuard({ module, children }) {
  const { hasModuleAccess, currentUser } = useApp();
  if (module === 'users') {
    return currentUser?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
  }
  if (module === 'settings') {
    return (currentUser?.role === 'admin' || hasModuleAccess('settings')) ? children : <Navigate to="/dashboard" replace />;
  }
  return hasModuleAccess(module) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useApp();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ModuleGuard module="dashboard"><Dashboard /></ModuleGuard>} />
        <Route path="/stock" element={<ModuleGuard module="stock"><Stock /></ModuleGuard>} />
        <Route path="/customers" element={<ModuleGuard module="customers"><Customers /></ModuleGuard>} />
        <Route path="/customers/:id" element={<ModuleGuard module="customers"><CustomerDetail /></ModuleGuard>} />
        <Route path="/invoices" element={<ModuleGuard module="invoices"><Invoices /></ModuleGuard>} />
        <Route path="/invoices/new" element={<ModuleGuard module="invoices"><CreateInvoice /></ModuleGuard>} />
        <Route path="/invoices/edit/:id" element={<ModuleGuard module="invoices"><CreateInvoice /></ModuleGuard>} />
        <Route path="/invoices/:id" element={<ModuleGuard module="invoices"><InvoiceDetail /></ModuleGuard>} />
        <Route path="/refill" element={<ModuleGuard module="refill"><RefillTracking /></ModuleGuard>} />
        <Route path="/expenses" element={<ModuleGuard module="expenses"><Expenses /></ModuleGuard>} />
        <Route path="/reports" element={<ModuleGuard module="reports"><Reports /></ModuleGuard>} />
        <Route path="/notes" element={<ModuleGuard module="notes"><PersonalNotes /></ModuleGuard>} />
        <Route path="/settings" element={<ModuleGuard module="settings"><Settings /></ModuleGuard>} />
        <Route path="/users" element={<ModuleGuard module="users"><UserManagement /></ModuleGuard>} />
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

