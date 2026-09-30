import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import InstallAppBanner, { promptAppInstall } from './InstallAppBanner';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { currentUser, agencySettings } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jig_sidebar_collapsed') === 'true';
    } catch (_e) { return false; }
  });

  // Automatically close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Listen for localStorage changes from sidebar
  useEffect(() => {
    const handleStorage = () => {
      try {
        setCollapsed(localStorage.getItem('jig_sidebar_collapsed') === 'true');
      } catch (_e) {}
    };

    const handleCustom = (e) => {
      if (e.detail?.key === 'jig_sidebar_collapsed') {
        setCollapsed(e.detail.value === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-toggle', handleCustom);
    };
  }, []);

  // Determine current page title for mobile top bar
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Dashboard';
    if (p.includes('/customers/')) return 'Customer Profile';
    if (p.includes('/customers')) return 'Customers';
    if (p.includes('/invoices/new')) return 'New Invoice';
    if (p.includes('/invoices/edit')) return 'Edit Invoice';
    if (p.includes('/invoices/')) return 'Invoice Details';
    if (p.includes('/invoices')) return 'Invoices & Billing';
    if (p.includes('/stock')) return 'Stock Warehouse';
    if (p.includes('/refill')) return 'Refill Trips';
    if (p.includes('/expenses')) return 'Expenses';
    if (p.includes('/reports')) return 'Reports';
    if (p.includes('/notes')) return 'Personal Notes';
    if (p.includes('/settings')) return 'Agency Settings';
    if (p.includes('/users')) return 'User Accounts';
    return 'Jaydeep Gas';
  };

  const roleBadge = (role) => {
    if (role === 'admin') return <span className="mobile-header-badge badge-admin">👑 Admin</span>;
    if (role === 'visitor') return <span className="mobile-header-badge badge-visitor">👁️ Visitor</span>;
    return <span className="mobile-header-badge badge-staff">👷 Staff</span>;
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''} ${mobileMenuOpen ? 'mobile-nav-active' : ''}`}>
      {/* Global Quick PWA Install Banner */}
      <InstallAppBanner />

      {/* Mobile Top App Bar (Visible on <= 900px) */}
      <header className="mobile-top-bar">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle mobile menu"
          title="Open Menu"
        >
          <span className="hamburger-icon-bar" />
          <span className="hamburger-icon-bar" />
          <span className="hamburger-icon-bar" />
        </button>

        <div className="mobile-top-bar-center">
          <div className="mobile-brand-title">
            <span className="mobile-brand-flame">🔥</span>
            <span className="mobile-brand-name">{agencySettings?.agencyName?.split(' ')[0] || 'JAYDEEP'}</span>
          </div>
          <div className="mobile-page-title">{getPageTitle()}</div>
        </div>

        <div className="mobile-top-bar-right">
          {currentUser && roleBadge(currentUser.role)}
          <button
            type="button"
            className="mobile-quick-install-btn"
            onClick={promptAppInstall}
            title="Install App"
            aria-label="Install App"
          >
            📲
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true" 
        />
      )}

      {/* Main Responsive Sidebar Drawer */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />

      {/* Main Body Content */}
      <main className="main-content">
        <div className="main-content-scroll-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Dock (Visible on <= 900px) */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Navigation">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `mobile-dock-item${isActive ? ' active' : ''}`}
        >
          <span className="mobile-dock-icon">📊</span>
          <span className="mobile-dock-label">Dashboard</span>
        </NavLink>

        <NavLink 
          to="/customers" 
          className={({ isActive }) => `mobile-dock-item${isActive ? ' active' : ''}`}
        >
          <span className="mobile-dock-icon">👥</span>
          <span className="mobile-dock-label">Customers</span>
        </NavLink>

        <NavLink 
          to="/invoices/new" 
          className={({ isActive }) => `mobile-dock-item mobile-dock-center-action${isActive ? ' active' : ''}`}
          title="Create New Bill"
        >
          <div className="dock-center-btn">
            <span className="dock-center-icon">➕</span>
          </div>
          <span className="mobile-dock-label">New Bill</span>
        </NavLink>

        <NavLink 
          to="/invoices" 
          className={({ isActive }) => `mobile-dock-item${isActive ? ' active' : ''}`}
        >
          <span className="mobile-dock-icon">🧾</span>
          <span className="mobile-dock-label">Invoices</span>
        </NavLink>

        <button 
          type="button"
          className={`mobile-dock-item${mobileMenuOpen ? ' active' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
        >
          <span className="mobile-dock-icon">☰</span>
          <span className="mobile-dock-label">Menu</span>
        </button>
      </nav>
    </div>
  );
}
