import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { promptAppInstall } from './InstallAppBanner';

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

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { logout, currentUser, hasModuleAccess, agencySettings } = useApp();
  const navigate = useNavigate();

  // Collapsed sidebar state with localStorage persistence for desktop
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
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/login');
  };

  const handleItemClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const visibleNavItems = allNavItems.filter(item => hasModuleAccess(item.module));

  const roleBadge = (role) => {
    if (role === 'admin') return <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 800 }}>👑 Admin</span>;
    if (role === 'visitor') return <span className="badge badge-info" style={{ fontSize: '0.68rem', fontWeight: 800 }}>👁️ Visitor</span>;
    return <span className="badge badge-primary" style={{ fontSize: '0.68rem', fontWeight: 800 }}>👷 Staff</span>;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Floating Edge Toggle Tab on Right Border (Desktop only) */}
      <button
        className="sidebar-edge-toggle-btn desktop-only"
        onClick={() => setCollapsed(prev => !prev)}
        title={collapsed ? 'Maximize sidebar' : 'Minimize sidebar'}
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
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c, #dc2626)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
            }}>🔥</div>
            {(!collapsed || mobileOpen) && (
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

          {/* Mobile Close Drawer Button */}
          <button
            className="sidebar-mobile-close-btn mobile-only"
            onClick={onCloseMobile}
            title="Close Menu"
            aria-label="Close Menu"
          >
            ✕
          </button>

          {/* Desktop Top Header Minimize Button when Expanded */}
          {!collapsed && (
            <button
              className="sidebar-header-toggle-btn desktop-only"
              onClick={() => setCollapsed(true)}
              title="Minimize Sidebar"
              aria-label="Minimize Sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Maximize Button in Header when Collapsed (Desktop only) */}
        {collapsed && (
          <button
            className="sidebar-collapsed-expand-btn desktop-only"
            onClick={() => setCollapsed(false)}
            title="Maximize Sidebar"
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
        {(!collapsed || mobileOpen) && <div className="nav-section-label">Main Menu</div>}
        {visibleNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleItemClick}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed && !mobileOpen ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {(!collapsed || mobileOpen) && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}

        {(currentUser?.role === 'admin' || hasModuleAccess('settings')) && (
          <>
            {(!collapsed || mobileOpen) && <div className="nav-section-label" style={{ marginTop: 14 }}>Administration</div>}
            <NavLink
              to="/settings"
              onClick={handleItemClick}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed && !mobileOpen ? 'Agency Settings' : undefined}
            >
              <span className="nav-icon">⚙️</span>
              {(!collapsed || mobileOpen) && <span className="nav-label">Agency Settings</span>}
            </NavLink>
            {currentUser?.role === 'admin' && (
              <NavLink
                to="/users"
                onClick={handleItemClick}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={collapsed && !mobileOpen ? 'User Accounts' : undefined}
              >
                <span className="nav-icon">👥🔑</span>
                {(!collapsed || mobileOpen) && <span className="nav-label">User Accounts</span>}
              </NavLink>
            )}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {currentUser && (!collapsed || mobileOpen) && (
          <div style={{
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: '10px',
            marginBottom: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                @{currentUser.username}
              </div>
            </div>
            <div>
              {roleBadge(currentUser.role)}
            </div>
          </div>
        )}

        {currentUser && collapsed && !mobileOpen && (
          <div style={{ textAlign: 'center', marginBottom: 10 }} title={currentUser.name}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', margin: '0 auto'
            }}>
              {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Install Web App Button */}
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            promptAppInstall();
          }}
          className="sidebar-install-app-btn"
          title="Install App on Phone / Desktop"
        >
          <span>📲</span>
          {(!collapsed || mobileOpen) && <span>Install Mobile App</span>}
        </button>

        {/* View Public Website */}
        {(!collapsed || mobileOpen) ? (
          <NavLink to="/" onClick={handleItemClick} className="sidebar-website-btn">
            <span>🌐</span> View Website
          </NavLink>
        ) : (
          <NavLink to="/" onClick={handleItemClick} className="sidebar-website-btn" title="View Website">
            🌐
          </NavLink>
        )}

        {/* Clear Bottom Minimize / Maximize Toggle Button (Desktop only) */}
        <button
          className="sidebar-footer-toggle-btn desktop-only"
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? "Maximize Sidebar" : "Minimize Sidebar"}
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

        <button className="logout-btn" onClick={handleLogout} title={collapsed && !mobileOpen ? 'Logout' : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {(!collapsed || mobileOpen) && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
