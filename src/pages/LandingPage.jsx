import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const { isLoggedIn } = useApp();

  return (
    <div className="landing-wrapper light-theme-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Public Navbar */}
      <header className="landing-header">
        <div className="landing-container header-inner" style={{ justifyContent: 'space-between' }}>
          <div className="brand-logo">
            <div className="brand-icon-box">
              <span className="flame-icon">🔥</span>
            </div>
            <div>
              <div className="brand-title">JAYDEEP INDIAN GAS</div>
              <div className="brand-tagline">Authorized Indian / Indane LPG Distributor</div>
            </div>
          </div>

          <div className="header-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-refill-cta">
                📊 Go to Admin Panel
              </Link>
            ) : (
              <Link to="/login" className="btn-refill-cta">
                🔑 Admin Login
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

            <div className="hero-cta-group" style={{ justifyContent: 'center', width: '100%' }}>
              {isLoggedIn ? (
                <Link to="/dashboard" className="hero-btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                  📊 Open Admin Panel
                </Link>
              ) : (
                <Link to="/login" className="hero-btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                  🔑 Login to Admin Panel
                </Link>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="hero-stats-row" style={{ justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
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
      <footer className="landing-footer" style={{ padding: '2rem 0', marginTop: 'auto' }}>
        <div className="footer-bottom" style={{ borderTop: 'none', padding: 0 }}>
          <div className="landing-container bottom-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div>
              © {new Date().getFullYear()} Jaydeep Indian Gas Agency. Authorized Indane LPG Distributor.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
