import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { exportAllInvoicesExcel } from '../utils/exportExcel';

const COLORS = ['#ea580c', '#3b82f6', '#16a34a', '#dc2626'];

export default function Dashboard() {
  const {
    invoices,
    stock,
    customers,
    loading,
    resetAllDataWithPin,
    reloadData,
    currentUser,
    canEditModule,
    agencySettings,
  } = useApp();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Reset Data state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetStep, setResetStep] = useState('pin'); // 'pin' | 'confirm' | 'resetting' | 'success'
  const [resetError, setResetError] = useState('');
  const [pinShake, setPinShake] = useState(false);

  const dayInvoices = invoices.filter(i => i.date === selectedDate);
  const dayRevenue = dayInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const dayOutstanding = dayInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  const totalFilled = stock.reduce((s, st) => s + st.filledCount, 0);
  const totalEmpty = stock.reduce((s, st) => s + st.emptyCount, 0);

  const recentInvoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const cylinderDistData = stock.map(s => ({
    name: s.cylinderType,
    Filled: s.filledCount,
    Empty: s.emptyCount,
  }));

  const pieData = stock.map(s => ({
    name: `${s.cylinderType} (${s.filledCount}F/${s.emptyCount}E)`,
    value: s.filledCount + s.emptyCount,
  }));

  // Compute monthly sales data from real invoices
  const monthlySalesData = useMemo(() => {
    const monthMap = {};
    invoices.forEach(inv => {
      const month = new Date(inv.date).toLocaleString('en-US', { month: 'short' });
      if (!monthMap[month]) monthMap[month] = { month, '5kg': 0, '19kg': 0, '47.5kg': 0, revenue: 0 };
      monthMap[month].revenue += inv.totalAmount;
      inv.items.forEach(item => {
        if (monthMap[month][item.cylinderType] !== undefined) {
          monthMap[month][item.cylinderType] += item.qty;
        }
      });
    });
    return Object.values(monthMap);
  }, [invoices]);

  const payBadge = (status) => {
    if (status === 'Paid') return <span className="badge badge-success">Paid</span>;
    if (status === 'Partial') return <span className="badge badge-warning">Partial</span>;
    return <span className="badge badge-danger">Unpaid</span>;
  };

  // Reset Data handlers
  const openResetModal = () => {
    setShowResetModal(true);
    setResetPin('');
    setResetStep('pin');
    setResetError('');
    setPinShake(false);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetPin('');
    setResetStep('pin');
    setResetError('');
  };

  const handlePinSubmit = () => {
    if (resetPin === '2323') {
      setResetStep('confirm');
      setResetError('');
    } else {
      setResetError('Incorrect PIN! Please try again.');
      setPinShake(true);
      setTimeout(() => setPinShake(false), 600);
      setResetPin('');
    }
  };

  const handleConfirmReset = async () => {
    setResetStep('resetting');
    try {
      await resetAllDataWithPin(resetPin);
      setResetStep('success');
      setTimeout(() => {
        closeResetModal();
        reloadData();
      }, 2000);
    } catch (err) {
      setResetError('Failed to reset data: ' + err.message);
      setResetStep('pin');
    }
  };

  const handlePinKeyDown = (e) => {
    if (e.key === 'Enter') handlePinSubmit();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Loading data from database...</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Dashboard...</div>
            <div style={{ fontSize: '0.85rem', marginTop: 8 }}>Fetching data from Supabase</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">{agencySettings?.agencyName || 'Jaydeep Indian Gas Agency'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {currentUser?.role === 'admin' && (
            <button className="btn btn-danger" onClick={openResetModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ Reset All Data
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => window.open('/', '_blank')}>
            🌐 Open Website
          </button>
          {canEditModule('invoices') && (
            <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
              ＋ New Billing Invoice
            </button>
          )}
        </div>
      </div>

      {/* Day-wise Snapshot */}
      <div className="card mb-24" style={{ borderLeft: '4px solid var(--accent)' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="fw-700" style={{ fontSize: '1.1rem' }}>📅 Day-wise Snapshot</span>
            <input 
              className="form-control" 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              style={{ padding: '8px 12px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Day Revenue (Sell)</div>
              <div className="text-success fw-800" style={{ fontSize: '1.3rem' }}>₹{dayRevenue.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Collection</div>
              <div className="text-danger fw-800" style={{ fontSize: '1.3rem' }}>₹{dayOutstanding.toLocaleString('en-IN')}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => exportAllInvoicesExcel(dayInvoices, agencySettings, stock)}>
              📥 Export Day Report
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--card-accent': '#16a34a' }}>
          <span className="stat-card-icon">💰</span>
          <span className="stat-card-label">Total Revenue</span>
          <span className="stat-card-value" style={{ fontSize: '1.35rem', color: '#16a34a' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
          <span className="stat-card-sub">All billed invoices</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#dc2626' }}>
          <span className="stat-card-icon">⚠️</span>
          <span className="stat-card-label">Outstanding Due</span>
          <span className="stat-card-value" style={{ fontSize: '1.35rem', color: '#dc2626' }}>₹{totalOutstanding.toLocaleString('en-IN')}</span>
          <span className="stat-card-sub">Pending collections</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#16a34a' }}>
          <span className="stat-card-icon">🟢</span>
          <span className="stat-card-label">Filled Cylinders</span>
          <span className="stat-card-value text-success">{totalFilled}</span>
          <span className="stat-card-sub">Ready in warehouse</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f87171' }}>
          <span className="stat-card-icon">🔴</span>
          <span className="stat-card-label">Empty Cylinders</span>
          <span className="stat-card-value" style={{ color: '#dc2626' }}>{totalEmpty}</span>
          <span className="stat-card-sub">Awaiting plant refill</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#8b5cf6' }}>
          <span className="stat-card-icon">👥</span>
          <span className="stat-card-label">Registered Consumers</span>
          <span className="stat-card-value">{customers.length}</span>
          <span className="stat-card-sub">Domestic & Commercial</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#ea580c' }}>
          <span className="stat-card-icon">📦</span>
          <span className="stat-card-label">Total Cylinders</span>
          <span className="stat-card-value">{totalFilled + totalEmpty}</span>
          <span className="stat-card-sub">Full agency stock</span>
        </div>
      </div>


      {/* Charts Grid */}
      <div className="chart-grid">
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">📊 Monthly Sales & Cylinder Volume</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySalesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: 12 }} />
              <Bar dataKey="5kg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="19kg" fill="#ea580c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="47.5kg" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">📈 Monthly Revenue Trend (₹)</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={monthlySalesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} dot={{ fill: '#ea580c', r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">🥧 Cylinder Stock Distribution</div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
              />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🕒 Recent Invoices</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/invoices')}>View All →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No invoices yet. Create your first invoice!</td></tr>
              ) : recentInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="text-accent fw-600">{inv.invoiceNumber}</td>
                  <td>{inv.date}</td>
                  <td>{inv.customerName}</td>
                  <td className="fw-600">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td>{payBadge(inv.paymentStatus)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Data PIN Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            {resetStep === 'pin' && (
              <>
                <div className="reset-modal-header">
                  <div className="reset-modal-icon reset-modal-icon-warning">🔐</div>
                  <h2>PIN Verification Required</h2>
                  <p className="reset-modal-desc">Enter your 4-digit security PIN to proceed with data reset</p>
                </div>
                <div className="reset-modal-body">
                  <div className={`reset-pin-input-wrap ${pinShake ? 'pin-shake' : ''}`}>
                    <input
                      className={`reset-pin-input ${resetError ? 'reset-pin-error' : ''}`}
                      type="password"
                      maxLength={4}
                      placeholder="● ● ● ●"
                      value={resetPin}
                      onChange={(e) => { setResetPin(e.target.value.replace(/\D/g, '')); setResetError(''); }}
                      onKeyDown={handlePinKeyDown}
                      autoFocus
                    />
                  </div>
                  {resetError && (
                    <div className="reset-error-msg">
                      <span>❌</span> {resetError}
                    </div>
                  )}
                </div>
                <div className="reset-modal-footer">
                  <button className="btn btn-secondary" onClick={closeResetModal}>Cancel</button>
                  <button className="btn btn-danger" onClick={handlePinSubmit} disabled={resetPin.length < 4}>
                    🔓 Verify PIN
                  </button>
                </div>
              </>
            )}

            {resetStep === 'confirm' && (
              <>
                <div className="reset-modal-header">
                  <div className="reset-modal-icon reset-modal-icon-danger">⚠️</div>
                  <h2>Confirm Full Data Reset</h2>
                  <p className="reset-modal-desc">This action will permanently delete:</p>
                </div>
                <div className="reset-modal-body">
                  <div className="reset-items-list">
                    <div className="reset-item">🗑️ All Customers ({customers.length})</div>
                    <div className="reset-item">🗑️ All Invoices ({invoices.length})</div>
                    <div className="reset-item">🗑️ All Expenses</div>
                    <div className="reset-item">🗑️ All Refill Trips</div>
                    <div className="reset-item">🗑️ All Personal Notes & Attachments</div>
                    <div className="reset-item">🗑️ Stock Counts → Reset to 0</div>
                  </div>
                  <div className="reset-warning-box">
                    ⚠️ <strong>This action cannot be undone!</strong> All data will be permanently erased from the database.
                  </div>
                </div>
                <div className="reset-modal-footer">
                  <button className="btn btn-secondary" onClick={closeResetModal}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleConfirmReset}>
                    🗑️ Yes, Reset Everything
                  </button>
                </div>
              </>
            )}

            {resetStep === 'resetting' && (
              <div className="reset-modal-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div className="reset-spinner"></div>
                <h3 style={{ marginTop: 20, color: 'var(--text-primary)' }}>Resetting All Data...</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Please wait while all data is being cleared</p>
              </div>
            )}

            {resetStep === 'success' && (
              <div className="reset-modal-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div className="reset-modal-icon reset-modal-icon-success" style={{ margin: '0 auto 16px' }}>✅</div>
                <h3 style={{ color: 'var(--success)' }}>Data Reset Complete!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>All data has been successfully cleared</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
