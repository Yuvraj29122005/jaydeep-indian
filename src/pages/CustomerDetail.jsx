import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportCustomerReportPDF } from '../utils/exportPdf';
import { exportCustomerReportExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };

const payBadge = (status) => {
  if (status === 'Paid') return <span className="badge badge-success">Paid</span>;
  if (status === 'Partial') return <span className="badge badge-warning">Partial</span>;
  return <span className="badge badge-danger">Unpaid</span>;
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, invoices } = useApp();

  const customer = customers.find(c => c.id === id);

  if (!customer) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>Customer Not Found</h3>
          <p>The customer you are looking for does not exist.</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/customers')}>← Back to Customers</button>
        </div>
      </div>
    );
  }

  // Fetch all invoices for this customer, sorted date descending
  const customerInvoices = invoices
    .filter(inv => inv.customerId === id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate totals
  const totalBusiness = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = totalBusiness - totalPaid;

  // Calculate filled bottles sold (from invoice balance)
  const bottleBalance = customer.bottleBalance || {
    '5kg': { filledGiven: 0, emptyCollected: 0 },
    '19kg': { filledGiven: 0, emptyCollected: 0 },
    '47.5kg': { filledGiven: 0, emptyCollected: 0 },
  };
  const totalFilledBottlesSold = CYLINDER_TYPES.reduce((sum, t) => sum + (bottleBalance[t]?.filledGiven || 0), 0);

  // Calculate empty bottle stock (from manual stock system)
  const emptyStock = customer.emptyBottleStock || {
    '5kg': { withCustomer: 0, collected: 0 },
    '19kg': { withCustomer: 0, collected: 0 },
    '47.5kg': { withCustomer: 0, collected: 0 },
  };
  const totalBottlesToCollect = CYLINDER_TYPES.reduce((sum, t) => {
    const s = emptyStock[t] || { withCustomer: 0, collected: 0 };
    return sum + Math.max(0, s.withCustomer - s.collected);
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{customer.name} — Ledger</h1>
          <p className="page-subtitle">{customer.phone} | {customer.address}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-info btn-sm" onClick={() => navigate(`/invoices/new?type=empty&customer=${customer.id}`)}>
            🫙 Empty Bottle Invoice
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/invoices/new?customer=${customer.id}`)}>
            ➕ Refill Invoice
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCustomerReportPDF(customer, customerInvoices)}>
            📄 Statement (PDF)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCustomerReportExcel(customer, customerInvoices)}>
            📥 Statement (Excel)
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Filled Bottles Sold Card */}
        <div className="card" style={{
          border: '2px solid var(--success)',
          background: 'rgba(34,197,94,0.04)',
          marginBottom: 0
        }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
            <span className="card-title">🟢 Filled Bottles Sold</span>
            {totalFilledBottlesSold > 0 ? (
              <span className="badge badge-success" style={{ fontSize: '1rem', fontWeight: 700, padding: '6px 16px' }}>
                {totalFilledBottlesSold} total sold
              </span>
            ) : (
              <span className="badge badge-muted" style={{ fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px' }}>
                No sales yet
              </span>
            )}
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
              {CYLINDER_TYPES.map(type => {
                const b = bottleBalance[type] || { filledGiven: 0, emptyCollected: 0 };
                return (
                  <div key={type} style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'var(--bg-primary)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {CYL_ICONS[type]} {type}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                      {b.filledGiven}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty Bottles to Collect Card */}
        <div className="card" style={{
          border: totalBottlesToCollect > 0 ? '2px solid var(--danger)' : '2px solid var(--border)',
          background: totalBottlesToCollect > 0 ? 'rgba(239,68,68,0.04)' : 'var(--bg-primary)',
          marginBottom: 0
        }}>
          <div className="card-header" style={{ borderBottom: totalBottlesToCollect > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border)' }}>
            <span className="card-title">🫙 Empty Bottles to Collect</span>
            {totalBottlesToCollect > 0 ? (
              <span className="badge badge-danger" style={{ fontSize: '1rem', fontWeight: 700, padding: '6px 16px' }}>
                {totalBottlesToCollect} bottles pending
              </span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.9rem', fontWeight: 600, padding: '6px 14px' }}>
                ✅ All clear
              </span>
            )}
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {CYLINDER_TYPES.map(type => {
                const s = emptyStock[type] || { withCustomer: 0, collected: 0 };
                const net = s.withCustomer - s.collected;
                return (
                  <div key={type} style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-body)',
                    border: net > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                      {CYL_ICONS[type]} {type}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', textAlign: 'center' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Cust:</span> <span style={{ fontWeight: 600 }}>{s.withCustomer}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Coll:</span> <span style={{ fontWeight: 600 }}>{s.collected}</span></div>
                    </div>
                    <div style={{
                      padding: '4px 8px', borderRadius: 6,
                      background: net > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      fontWeight: 700, fontSize: '0.9rem',
                      color: net > 0 ? 'var(--danger)' : 'var(--success)',
                      minWidth: 50, textAlign: 'center'
                    }}>
                      {Math.max(0, net)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Customer-wise Prices + Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Business</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>₹{totalBusiness.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Across {customerInvoices.length} invoices</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Paid</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginTop: 8 }}>₹{totalPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Balance Due</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalDue > 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: 8 }}>₹{totalDue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Customer-wise Prices */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">💰 Customer-wise Prices</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {CYLINDER_TYPES.map(type => (
              <div key={type} style={{
                padding: '12px 20px',
                borderRadius: 10,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
                minWidth: 160,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{CYL_ICONS[type]}</span>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>₹{customer.prices[type]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">🧾 Transaction History</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Type</th>
                <th>Items Summary</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customerInvoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No transactions found for this customer.</td></tr>
              ) : customerInvoices.map(inv => {
                const isEB = inv.invoiceType === 'Empty Bottle';
                const bal = inv.totalAmount - inv.paidAmount;
                return (
                <tr key={inv.id}>
                  <td>{inv.date}</td>
                  <td className="fw-600 text-accent">{inv.invoiceNumber}</td>
                  <td>
                    <span className={`badge ${isEB ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                      {isEB ? '🫙 Empty Bottle' : '🟢 Refill'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {isEB ? (
                      <span style={{ color: 'var(--info)' }}>
                        {inv.items.map(i => `🫙 ${i.qty}× ${i.cylinderType} (Collected)`).join(', ')}
                      </span>
                    ) : (
                      inv.items.map(i => `${i.qty}× ${i.cylinderType}${i.emptyCollected ? ' (↩ empty)' : ''}`).join(', ')
                    )}
                  </td>
                  <td className="fw-600">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="text-success">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                  <td style={{ color: bal > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: bal > 0 ? 700 : 400 }}>
                    ₹{bal.toLocaleString('en-IN')}
                  </td>
                  <td>{payBadge(inv.paymentStatus)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)}>View Invoice</button>
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
