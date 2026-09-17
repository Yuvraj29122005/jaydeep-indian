import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportInvoicePDF } from '../utils/exportPdf';
import { exportInvoiceExcel } from '../utils/exportExcel';

const payBadge = (status) => {
  if (status === 'Paid') return <span className="badge badge-success">💰 Paid</span>;
  if (status === 'Partial') return <span className="badge badge-warning">⚡ Partial</span>;
  return <span className="badge badge-danger">❌ Unpaid</span>;
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const { invoices, updateInvoice, customers } = useApp();
  const navigate = useNavigate();

  const invoice = invoices.find(inv => inv.id === id);


  const [paymentStatus, setPaymentStatus] = useState(invoice?.paymentStatus || 'Unpaid');
  const [paidAmount, setPaidAmount] = useState(invoice?.paidAmount || 0);
  const [editingPayment, setEditingPayment] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!invoice) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Invoice Not Found</h3>
          <p>The invoice you're looking for doesn't exist.</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>← Back to Invoices</button>
        </div>
      </div>
    );
  }

  const balance = invoice.totalAmount - paidAmount;

  const saveChanges = () => {
    const newPayStatus = paidAmount <= 0 ? 'Unpaid' : paidAmount >= invoice.totalAmount ? 'Paid' : 'Partial';
    updateInvoice(id, { paymentStatus: newPayStatus, paidAmount: Number(paidAmount) });
    setPaymentStatus(newPayStatus);
    setSaved(true);
    setEditingPayment(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/invoices')} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{invoice.invoiceNumber}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {payBadge(paymentStatus)}
            {saved && <span className="badge badge-success">✓ Saved!</span>}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => navigate(`/invoices/edit/${id}`)}>
            ✏️ Edit Invoice
          </button>
          <button className="btn btn-info" onClick={() => exportInvoicePDF({ ...invoice, paymentStatus, paidAmount })}>
            📄 Download PDF
          </button>
          <button className="btn btn-success" onClick={() => exportInvoiceExcel({ ...invoice, paymentStatus, paidAmount })}>
            📥 Download Excel
          </button>
        </div>
      </div>

      {/* Invoice Header */}
      <div className="invoice-detail-header">
        <div>
          <div className="inv-company-name">🔥 JAYDEEP INDIAN GAS AGENCY</div>
          <div className="inv-sub">Authorized Indian Gas Distributor | Surat, Gujarat</div>
          <div className="inv-sub">Phone: 9876543210 | GSTIN: 24ABCDE1234F1Z5</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>INVOICE</div>
          <div className="inv-number text-accent">{invoice.invoiceNumber}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>📅 {invoice.date}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💳 {invoice.paymentMode}</div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="invoice-grid">
        <div className="invoice-section">
          <h4>👤 Bill To</h4>
          <div className="inv-field"><span className="label">Name</span><span className="value">{invoice.customerName}</span></div>
          <div className="inv-field"><span className="label">Phone</span><span className="value">{invoice.customerPhone}</span></div>
          <div className="inv-field"><span className="label">Address</span><span className="value" style={{ maxWidth: 200, textAlign: 'right' }}>{invoice.customerAddress}</span></div>
          {/* Bottle Balance */}
          {(() => {
            const cust = customers.find(c => c.id === invoice.customerId);
            if (!cust || !cust.bottleBalance) return null;
            const bal = cust.bottleBalance;
            const totalNet = ['5kg', '19kg', '47.5kg'].reduce((s, t) => {
              const b = bal[t] || { filledGiven: 0, emptyCollected: 0 };
              return s + (b.filledGiven - b.emptyCollected);
            }, 0);
            return totalNet > 0 ? (
              <div style={{ marginTop: 12, padding: 8, background: 'rgba(245,158,11,0.06)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700 }}>🫙 Bottles with customer: </span>
                {['5kg', '19kg', '47.5kg'].map(t => {
                  const b = bal[t] || { filledGiven: 0, emptyCollected: 0 };
                  const net = b.filledGiven - b.emptyCollected;
                  return net > 0 ? <span key={t} className="badge badge-warning" style={{ marginLeft: 6, fontSize: '0.7rem' }}>{t}: {net}</span> : null;
                })}
              </div>
            ) : null;
          })()}
        </div>

        <div className="invoice-section">
          <h4>📋 Status Management</h4>
          <div className="form-group">
            <label className="form-label">Amount Paid (₹)</label>
            <input
              className="form-control"
              type="number"
              min="0"
              max={invoice.totalAmount}
              value={paidAmount}
              onChange={e => setPaidAmount(Number(e.target.value))}
            />
          </div>
          <button className="btn btn-primary btn-sm mt-12" style={{ width: '100%' }} onClick={saveChanges}>
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="card mb-20">
        <div className="card-header"><span className="card-title">📦 Cylinder Items</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cylinder Type</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
                <th>Empty Collected</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-600">{item.cylinderType}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td className="fw-600 text-accent">₹{(item.qty * item.unitPrice).toLocaleString('en-IN')}</td>
                  <td>
                    {item.emptyCollected
                      ? <span className="badge badge-success">✅ Collected {item.emptyCount !== undefined ? item.emptyCount : item.qty}</span>
                      : <span className="badge badge-muted">Not Collected</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="totals-box">
            <div className="total-row grand">
              <span>Total Amount</span>
              <span>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="total-row" style={{ color: 'var(--success)' }}>
              <span>Amount Paid</span>
              <span>₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            {balance > 0 && (
              <div className="total-row balance">
                <span>Balance Due</span>
                <span>₹{balance.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes & Screenshot */}
      {(invoice.notes || invoice.privateNotes || invoice.paymentScreenshot) && (
        <div className="card">
          <div className="card-header"><span className="card-title">📝 Additional Details</span></div>
          <div className="card-body">
            {invoice.notes && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: invoice.paymentScreenshot || invoice.privateNotes ? 16 : 0 }}><strong>Notes:</strong> {invoice.notes}</p>}
            {invoice.privateNotes && <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(234, 88, 12, 0.2)', marginBottom: invoice.paymentScreenshot ? 16 : 0 }}><p style={{ color: 'var(--text-primary)', margin: 0 }}><strong>🔒 Private Description:</strong> {invoice.privateNotes}</p></div>}
            {invoice.paymentScreenshot && (
              <div>
                <span className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Payment Screenshot</span>
                <img src={invoice.paymentScreenshot} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, border: '1px solid var(--border)' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
