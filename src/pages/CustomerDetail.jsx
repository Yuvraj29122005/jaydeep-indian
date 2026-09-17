import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportCustomerReportPDF } from '../utils/exportPdf';
import { exportCustomerReportExcel } from '../utils/exportExcel';

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{customer.name} — Ledger</h1>
          <p className="page-subtitle">{customer.phone} | {customer.address}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-info" onClick={() => exportCustomerReportPDF(customer, customerInvoices)}>
            📄 Download Statement (PDF)
          </button>
          <button className="btn btn-success" onClick={() => exportCustomerReportExcel(customer, customerInvoices)}>
            📥 Download Statement (Excel)
          </button>
        </div>
      </div>

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
                <tr><td colSpan={8} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No transactions found for this customer.</td></tr>
              ) : customerInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.date}</td>
                  <td className="fw-600 text-accent">{inv.invoiceNumber}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {inv.items.map(i => `${i.qty}×${i.cylinderType}`).join(', ')}
                  </td>
                  <td className="fw-600">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="text-success">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                  <td style={{ color: (inv.totalAmount - inv.paidAmount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    ₹{(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}
                  </td>
                  <td>{payBadge(inv.paymentStatus)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/invoices/${inv.id}`)}>View Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
