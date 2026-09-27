import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jig_sidebar_collapsed') === 'true';
    } catch (_e) { return false; }
  });

  // Listen for localStorage changes from sidebar
  useEffect(() => {
    const handleStorage = () => {
      setCollapsed(localStorage.getItem('jig_sidebar_collapsed') === 'true');
    };

    // Custom event listener for same-tab storage updates
    const handleCustom = (e) => {
      if (e.detail?.key === 'jig_sidebar_collapsed') {
        setCollapsed(e.detail.value === 'true');
      }
    };

    // Poll for changes (simple sync)
    const interval = setInterval(() => {
      const val = localStorage.getItem('jig_sidebar_collapsed') === 'true';
      setCollapsed(prev => prev !== val ? val : prev);
    }, 200);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-toggle', handleCustom);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
