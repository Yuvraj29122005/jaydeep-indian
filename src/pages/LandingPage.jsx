import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InstallAppBanner, { promptAppInstall } from '../components/InstallAppBanner';

export default function LandingPage() {
  const { isLoggedIn, currentUser } = useApp();

  return (
    <div className="landing-wrapper light-theme-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Quick PWA Install Notification */}
      <InstallAppBanner />

      {/* Main Public Navbar */}
      <header className="landing-header">
        <div className="landing-container header-inner" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand-logo">
            <div className="brand-icon-box">
              <span className="flame-icon">🔥</span>
            </div>
            <div>
              <div className="brand-title">JAYDEEP INDIAN GAS</div>
              <div className="brand-tagline">Authorized Indian / Indane LPG Distributor</div>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={promptAppInstall}
              className="btn-install-header"
              title="Install Mobile App"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#c2410c',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <span>📲</span> <span className="header-btn-text">Install App</span>
            </button>

            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-refill-cta">
                📊 Portal Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-refill-cta">
                🔑 Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="landing-container hero-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', alignItems: 'center' }}>
            <div className="hero-badge" style={{ margin: '0 auto 1.5rem auto' }}>
              <span className="pulse-dot" />
              <span>OFFICIAL LPG ENERGY DISTRIBUTOR IN SURAT</span>
            </div>
            <h1 className="hero-heading" style={{ textAlign: 'center' }}>
              Pure Blue Flame. <br />
              <span className="gradient-text">Safe, Fast & Guaranteed</span> <br />
              LPG Gas Deliveries.
            </h1>
            <p className="hero-description" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Welcome to <strong>Jaydeep Indian Gas Agency</strong>. We deliver 100% weight-verified domestic and commercial Indane LPG cylinders directly to your kitchen and business with guaranteed safety and doorstep courtesy.
            </p>

            <div className="hero-cta-group" style={{ justifyContent: 'center', width: '100%', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {isLoggedIn ? (
                <Link to="/dashboard" className="hero-btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                  📊 Open Portal Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hero-btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
                    🔑 Login to Portal
                  </Link>
                  <button
                    type="button"
                    onClick={promptAppInstall}
                    className="hero-btn-secondary"
                    style={{
                      padding: '0.85rem 1.8rem',
                      fontSize: '1.05rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ffffff',
                      border: '2px solid #ea580c',
                      color: '#ea580c',
                      borderRadius: '10px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📲 Install Mobile App
                  </button>
                </>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="hero-stats-row" style={{ justifyContent: 'center', marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <div className="stat-item">
                <div className="stat-number">25k+</div>
                <div className="stat-label">Happy Households</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">45 Min</div>
                <div className="stat-label">Express Refill SLA</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9 ★</div>
                <div className="stat-label">Customer Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Weight Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="landing-footer" style={{ padding: '1.5rem 0', marginTop: 'auto' }}>
        <div className="footer-bottom" style={{ borderTop: 'none', padding: 0 }}>
          <div className="landing-container bottom-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              © {new Date().getFullYear()} Jaydeep Indian Gas Agency. Authorized Indane LPG Distributor.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
