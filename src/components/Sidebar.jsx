import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const allNavItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', module: 'dashboard' },
  { to: '/stock', icon: '🏭', label: 'Stock / Warehouse', module: 'stock' },
  { to: '/customers', icon: '👥', label: 'Customers & Ledger', module: 'customers' },
  { to: '/invoices', icon: '🧾', label: 'Invoices & Billing', module: 'invoices' },
  { to: '/invoices/new', icon: '➕', label: 'Create Invoice', module: 'invoices' },
  { to: '/refill', icon: '🚚', label: 'Refill Trips', module: 'refill' },
  { to: '/expenses', icon: '💸', label: 'Expenses', module: 'expenses' },
  { to: '/reports', icon: '📈', label: 'Reports & Analytics', module: 'reports' },
  { to: '/notes', icon: '📝', label: 'Personal Notes', module: 'notes' },
];

export default function Sidebar() {
  const { logout, currentUser, hasModuleAccess, agencySettings } = useApp();
  const navigate = useNavigate();

  // Collapsed sidebar state with localStorage persistence
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jig_sidebar_collapsed') === 'true';
    } catch (_e) { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('jig_sidebar_collapsed', String(collapsed));
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { key: 'jig_sidebar_collapsed', value: String(collapsed) } }));
    } catch (_e) {}
  }, [collapsed]);

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
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Floating Edge Toggle Tab on Right Border */}
      <button
        className="sidebar-edge-toggle-btn"
        onClick={() => setCollapsed(prev => !prev)}
        title={collapsed ? 'Maximize sidebar (Show menu names)' : 'Minimize sidebar (Show icons only)'}
        aria-label={collapsed ? 'Maximize sidebar' : 'Minimize sidebar'}
      >
        {collapsed ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        )}
      </button>

      {/* Brand Header */}
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.35)'
            }}>🔥</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div className="sidebar-brand-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agencySettings?.agencyName?.split(' ')[0] || 'JAYDEEP'}
                </div>
                <div className="sidebar-brand-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agencySettings?.tagline || 'Indian Gas Agency'}
                </div>
              </div>
            )}
          </div>

          {/* Top Header Minimize Button when Expanded */}
          {!collapsed && (
            <button
              className="sidebar-header-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Minimize Sidebar (Collapse)"
              aria-label="Minimize Sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Maximize Button in Header when Collapsed */}
        {collapsed && (
          <button
            className="sidebar-collapsed-expand-btn"
            onClick={() => setCollapsed(false)}
            title="Maximize Sidebar (Show menu names)"
            aria-label="Maximize Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Main Menu</div>}
        {visibleNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}

        {(currentUser?.role === 'admin' || hasModuleAccess('settings')) && (
          <>
            {!collapsed && <div className="nav-section-label" style={{ marginTop: 14 }}>Administration</div>}
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? 'Agency Settings' : undefined}
            >
              <span className="nav-icon">⚙️</span>
              {!collapsed && <span className="nav-label">Agency Settings</span>}
            </NavLink>
            {currentUser?.role === 'admin' && (
              <NavLink
                to="/users"
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={collapsed ? 'User Accounts' : undefined}
              >
                <span className="nav-icon">👥🔑</span>
                {!collapsed && <span className="nav-label">User Accounts</span>}
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {currentUser && !collapsed && (
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

        {currentUser && collapsed && (
          <div style={{ textAlign: 'center', marginBottom: 10 }} title={currentUser.name}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.85rem', margin: '0 auto'
            }}>
              {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Clear Bottom Minimize / Maximize Toggle Button */}
        <button
          className="sidebar-footer-toggle-btn"
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? "Maximize Sidebar (Show menu names)" : "Minimize Sidebar (Show icons only)"}
          aria-label={collapsed ? "Maximize Sidebar" : "Minimize Sidebar"}
        >
          {collapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
              <span>Minimize Sidebar</span>
            </>
          )}
        </button>

        {!collapsed ? (
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
        ) : (
          <NavLink to="/" className="sidebar-website-btn" title="View Website" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '9px 0',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontWeight: 600,
            fontSize: '1rem',
            marginBottom: '10px',
            textDecoration: 'none'
          }}>
            🌐
          </NavLink>
        )}

        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
