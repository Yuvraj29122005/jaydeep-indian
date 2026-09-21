import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportAllInvoicesExcel } from '../utils/exportExcel';
import { exportAllInvoicesPDF } from '../utils/exportPdf';

const payBadge = (status) => {
  if (status === 'Paid') return <span className="badge badge-success">Paid</span>;
  if (status === 'Partial') return <span className="badge badge-warning">Partial</span>;
  return <span className="badge badge-danger">Unpaid</span>;
};

export default function Invoices() {
  const { invoices } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = invoices.filter(inv => {
    const s = search.toLowerCase();
    const matchSearch = (inv.invoiceNumber || '').toLowerCase().includes(s) ||
      (inv.customerName || '').toLowerCase().includes(s);
    const matchPayment = filterPayment === 'All' || inv.paymentStatus === filterPayment;
    const invType = inv.invoiceType || 'Standard';
    const matchType = filterType === 'All' || invType === filterType;
    const matchDate = !filterDate || inv.date === filterDate;
    return matchSearch && matchPayment && matchType && matchDate;
  }).sort((a, b) => {
    let valA = a[sortField], valB = b[sortField];
    if (sortField === 'totalAmount') { valA = Number(valA); valB = Number(valB); }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const emptyBottleInvoicesCount = invoices.filter(i => i.invoiceType === 'Empty Bottle').length;
  const standardInvoicesCount = invoices.length - emptyBottleInvoicesCount;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total invoices · {filtered.length} shown</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => exportAllInvoicesExcel(invoices)}>📥 Excel</button>
          <button className="btn btn-secondary" onClick={() => exportAllInvoicesPDF(invoices)}>📄 PDF</button>
          <button className="btn btn-info" onClick={() => navigate('/invoices/new?type=empty')}>🫙 Empty Bottle Invoice</button>
          <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>➕ Refill Invoice</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by invoice # or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <input
          className="form-control"
          type="date"
          style={{ width: 160 }}
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />

        <select className="form-control" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Invoice Types</option>
          <option value="Standard">🟢 Standard Refill</option>
          <option value="Empty Bottle">🫙 Empty Bottle</option>
        </select>

        <select className="form-control" style={{ width: 140 }} value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
          <option value="All">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterType('All'); setFilterPayment('All'); setFilterDate(''); }}>
          ✖ Clear
        </button>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: invoices.length, color: 'var(--accent)' },
          { label: 'Standard Refill', count: standardInvoicesCount, color: 'var(--success)' },
          { label: 'Empty Bottle', count: emptyBottleInvoicesCount, color: '#3b82f6' },
          { label: 'Unpaid', count: invoices.filter(i => i.paymentStatus === 'Unpaid').length, color: 'var(--danger)' },
          { label: 'Partial', count: invoices.filter(i => i.paymentStatus === 'Partial').length, color: '#f59e0b' },
          { label: 'Paid', count: invoices.filter(i => i.paymentStatus === 'Paid').length, color: 'var(--success)' },
        ].map(pill => (
          <div key={pill.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{ color: pill.color, fontWeight: 700 }}>{pill.count}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{pill.label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('invoiceNumber')}>Invoice # <SortIcon field="invoiceNumber" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>Date <SortIcon field="date" /></th>
                <th>Customer</th>
                <th>Type</th>
                <th>Items</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('totalAmount')}>Total <SortIcon field="totalAmount" /></th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No invoices found</td></tr>
              ) : filtered.map(inv => {
                const isEB = inv.invoiceType === 'Empty Bottle';
                const totalAmt = Number(inv.totalAmount) || 0;
                const paidAmt = Number(inv.paidAmount) || 0;
                const bal = totalAmt - paidAmt;

                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="text-accent fw-600">{inv.invoiceNumber}</span>
                    </td>
                    <td>{inv.date}</td>
                    <td>
                      <div className="fw-600">{inv.customerName}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{inv.customerPhone}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${isEB ? 'badge-info' : 'badge-success'}`}
                        style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px' }}
                      >
                        {isEB ? '🫙 Empty Bottle' : '🟢 Refill'}
                      </span>
                    </td>
                    <td>
                      {inv.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.78rem', marginBottom: 2 }}>
                          {isEB ? (
                            <span style={{ color: 'var(--info)' }}>
                              🫙 {item.qty}× {item.cylinderType} (Collected)
                            </span>
                          ) : (
                            <>
                              {item.qty}× {item.cylinderType}
                              {item.emptyCollected && (
                                <span style={{ color: 'var(--success)', marginLeft: 4, fontWeight: 600 }}>
                                  ↩ {item.emptyCount !== undefined ? item.emptyCount : item.qty} empty
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="fw-600">₹{totalAmt.toLocaleString('en-IN')}</td>
                    <td className="text-success">₹{paidAmt.toLocaleString('en-IN')}</td>
                    <td style={{ color: bal > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: bal > 0 ? 700 : 400 }}>
                      ₹{bal.toLocaleString('en-IN')}
                    </td>
                    <td>{payBadge(inv.paymentStatus)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
