import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/stock', icon: '🏭', label: 'Stock Management' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/invoices', icon: '🧾', label: 'Invoices' },
  { to: '/refill', icon: '🚚', label: 'Refill Tracking' },
  { to: '/reports', icon: '📈', label: 'Reports' },
  { to: '/expenses', icon: '💸', label: 'Expenses' },
];

export default function Sidebar() {
  const { logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
          }}>🔥</div>
          <div>
            <div className="sidebar-brand-name">JAYDEEP</div>
            <div className="sidebar-brand-sub">Indian Gas Agency</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="sidebar-website-btn" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '10px',
          textAlign: 'center',
          justifyContent: 'center',
          textDecoration: 'none'
        }}>
          <span>🌐</span> View Website
        </NavLink>
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
