import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.error || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Login failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-header">
        <Link to="/" className="btn-back-home">
          ← Back to Agency Website
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
          <span>Authorized Staff, Visitor & Admin Login</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identifier">Username or Email Address</label>
            <input
              id="identifier"
              className="login-input"
              type="text"
              placeholder="e.g. admin or visitor1"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
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
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
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
              autoComplete="current-password"
              style={{ marginTop: 6 }}
              required
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Verifying Credentials...' : '🔑 Sign In to Admin Portal'}
          </button>
        </form>

      </div>
    </div>
  );
}
