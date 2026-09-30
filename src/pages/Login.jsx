import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn } = useApp();
  const navigate = useNavigate();

  // If already logged in, navigate cleanly to dashboard
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const executeLogin = async (idToUse, pwToUse) => {
    setError('');
    setLoading(true);
    try {
      const cleanId = (idToUse || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
      const cleanPw = (pwToUse || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
      const res = await login(cleanId, cleanPw);
      if (res && res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res?.error || 'Invalid username or password. Please verify your credentials.');
      }
    } catch (err) {
      setError('Login connection error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await executeLogin(identifier, password);
  };

  // Quick 1-tap mobile demo logins for Admin & Visitor
  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setIdentifier('admin');
      setPassword('Hiren@2311');
      executeLogin('admin', 'Hiren@2311');
    } else if (role === 'visitor') {
      setIdentifier('visitor');
      setPassword('visitor123');
      executeLogin('visitor', 'visitor123');
    } else if (role === 'staff') {
      setIdentifier('staff');
      setPassword('staff123');
      executeLogin('staff', 'staff123');
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-header">
        <Link to="/" className="btn-back-home">
          <span>←</span> Back to Public Website
        </Link>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔥</div>
          <div className="login-title">JAYDEEP INDIAN GAS</div>
          <div className="login-subtitle">Agency Management & Billing System</div>
        </div>

        <div className="portal-indicator">
          <span className="dot-live" />
          <span>Authorized Admin & Visitor Access</span>
        </div>

        {/* Quick One-Tap Mobile Login Buttons */}
        <div className="quick-login-section">
          <div className="quick-login-label">⚡ QUICK ONE-TAP LOGIN</div>
          <div className="quick-login-buttons">
            <button
              type="button"
              className="btn-quick-role btn-quick-admin"
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              title="Instant Admin Login"
            >
              <span className="quick-role-icon">👑</span>
              <div className="quick-role-text">
                <strong>Admin Panel</strong>
                <small>Full Access</small>
              </div>
            </button>

            <button
              type="button"
              className="btn-quick-role btn-quick-visitor"
              onClick={() => handleQuickLogin('visitor')}
              disabled={loading}
              title="Instant Visitor Login"
            >
              <span className="quick-role-icon">👁️</span>
              <div className="quick-role-text">
                <strong>Visitor Panel</strong>
                <small>Demo / View</small>
              </div>
            </button>
          </div>
        </div>

        <div className="login-divider">
          <span>or sign in manually</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="identifier">Username or Email</label>
            <input
              id="identifier"
              className="login-input"
              type="text"
              placeholder="e.g. admin or visitor"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-toggle-pw"
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️'}
              </button>
            </div>
            <input
              id="password"
              className="login-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              autoComplete="current-password"
              style={{ marginTop: 6 }}
              required
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Verifying Credentials...' : '🔑 Sign In to Portal'}
          </button>
        </form>

        <div className="login-help-footer">
          <div>💡 <strong>Admin:</strong> <code>admin</code> / <code>Hiren@2311</code></div>
          <div>👁️ <strong>Visitor:</strong> <code>visitor</code> / <code>visitor123</code></div>
        </div>
      </div>
    </div>
  );
}
