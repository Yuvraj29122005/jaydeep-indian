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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanId = (identifier || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
      const cleanPw = (password || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
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
          <span>Authorized Personnel Access Only</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="identifier">Username or Email</label>
            <input
              id="identifier"
              className="login-input"
              type="text"
              placeholder="Enter your username or email"
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
              placeholder="Enter your password"
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
          <div>🔒 Contact your administrator if you need access credentials.</div>
        </div>
      </div>
    </div>
  );
}

