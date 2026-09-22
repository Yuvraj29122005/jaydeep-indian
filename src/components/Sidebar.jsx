import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const allNavItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', module: 'dashboard' },
  { to: '/stock', icon: '🏭', label: 'Stock Management', module: 'stock' },
  { to: '/customers', icon: '👥', label: 'Customers', module: 'customers' },
  { to: '/invoices', icon: '🧾', label: 'Invoices', module: 'invoices' },
  { to: '/refill', icon: '🚚', label: 'Refill Tracking', module: 'refill' },
  { to: '/reports', icon: '📈', label: 'Reports', module: 'reports' },
  { to: '/expenses', icon: '💸', label: 'Expenses', module: 'expenses' },
  { to: '/notes', icon: '📝', label: 'Personal Notes', module: 'notes' },
];

export default function Sidebar() {
  const { logout, currentUser, hasModuleAccess } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = allNavItems.filter(item => hasModuleAccess(item.module));

  const roleBadge = (role) => {
    if (role === 'admin') return <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>👑 Admin</span>;
    if (role === 'visitor') return <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>👁️ Visitor</span>;
    return <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>👷 Staff</span>;
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
        {visibleNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {currentUser?.role === 'admin' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 14 }}>Administration</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">👥🔑</span>
              User Accounts
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {currentUser && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            marginBottom: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                @{currentUser.username}
              </div>
            </div>
            <div>
              {roleBadge(currentUser.role)}
            </div>
          </div>
        )}

        <NavLink to="/" className="sidebar-website-btn" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '9px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          fontWeight: 600,
          fontSize: '0.82rem',
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

