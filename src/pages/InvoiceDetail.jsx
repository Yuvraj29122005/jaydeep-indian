import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportInvoicePDF } from '../utils/exportPdf';
import { exportInvoiceExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const payBadge = (status) => {
  if (status === 'Paid') return <span className="badge badge-success">💰 Paid</span>;
  if (status === 'Partial') return <span className="badge badge-warning">⚡ Partial</span>;
  return <span className="badge badge-danger">❌ Unpaid</span>;
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const { invoices, updateInvoice, deleteInvoice, customers, agencySettings } = useApp();
  const navigate = useNavigate();

  const invoice = invoices.find(inv => inv.id === id);

  const [paymentStatus, setPaymentStatus] = useState(invoice?.paymentStatus || 'Unpaid');
  const [paidAmount, setPaidAmount] = useState(invoice?.paidAmount || 0);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const isEB = invoice.invoiceType === 'Empty Bottle';
  const cust = customers.find(c => c.id === invoice.customerId);

  const saveChanges = async () => {
    let newStatus = paymentStatus;
    if (paidAmount >= invoice.totalAmount) newStatus = 'Paid';
    else if (paidAmount > 0) newStatus = 'Partial';
    else newStatus = 'Unpaid';

    await updateInvoice(id, {
      paymentStatus: newStatus,
      paidAmount: Number(paidAmount),
    });
    setPaymentStatus(newStatus);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = async () => {
    await deleteInvoice(id);
    navigate('/invoices');
  };

  const balance = invoice.totalAmount - paidAmount;
  const currentSettings = agencySettings || {};

  return (
    <div className="page invoice-printable-page">
      {/* Top action bar - hidden on print */}
      <div className="page-header no-print">
        <div>
          <button className="btn btn-secondary btn-sm mb-8" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
          </button>
          <h1 className="page-title">{invoice.invoiceNumber}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <span className={`badge ${isEB ? 'badge-info' : 'badge-primary'}`}>
              {isEB ? '🫙 Empty Bottle Collection' : '🟢 Refill Invoice'}
            </span>
            {payBadge(paymentStatus)}
            {saved && <span className="badge badge-success">✓ Saved!</span>}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => window.print()} title="Print official bill / tax invoice">
            🖨️ Print Bill
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/invoices/edit/${id}`)}>
            ✏️ Edit Invoice
          </button>
          <button className="btn btn-info" onClick={() => exportInvoicePDF({ ...invoice, paymentStatus, paidAmount }, currentSettings)}>
            📄 Download PDF
          </button>
          <button className="btn btn-success" onClick={() => exportInvoiceExcel({ ...invoice, paymentStatus, paidAmount }, currentSettings)}>
            📥 Download Excel
          </button>
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            🗑 Delete
          </button>
        </div>
      </div>

      {/* Invoice Header */}
      <div className="invoice-detail-header invoice-bill-header">
        <div>
          <div className="inv-company-name">🔥 {currentSettings.agencyName || 'JAYDEEP INDIAN GAS AGENCY'}</div>
          <div className="inv-sub">
            {currentSettings.companyName && currentSettings.companyName !== currentSettings.agencyName ? (
              <strong>{currentSettings.companyName} · </strong>
            ) : null}
            {currentSettings.tagline || 'Authorized Indane LPG Distributor'} | {currentSettings.city || 'Surat'}, {currentSettings.state || 'Gujarat'}
          </div>
          <div className="inv-sub">
            <span>📞 Phone: {currentSettings.phone || '9876543210'}</span>
            {currentSettings.alternatePhone && <span> / {currentSettings.alternatePhone}</span>}
            {currentSettings.email && <span> | ✉️ {currentSettings.email}</span>}
          </div>
          <div className="inv-sub" style={{ marginTop: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
            <span>GSTIN: <span className="text-accent">{currentSettings.gstin || '24ABCDE1234F1Z5'}</span></span>
            {currentSettings.panNumber && <span> | PAN: {currentSettings.panNumber}</span>}
          </div>
          {currentSettings.address && (
            <div className="inv-sub" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              📍 {currentSettings.address}, {currentSettings.city} - {currentSettings.pincode}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>
            {isEB ? 'EMPTY BOTTLE RECEIPT' : 'TAX INVOICE'}
          </div>
          <div className="inv-number text-accent">{invoice.invoiceNumber}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>📅 Date: {invoice.date}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>💳 Mode: {invoice.paymentMode}</div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="invoice-grid">
        <div className="invoice-section">
          <h4>👤 Bill To</h4>
          <div className="inv-field"><span className="label">Name</span><span className="value fw-600">{invoice.customerName}</span></div>
          <div className="inv-field"><span className="label">Phone</span><span className="value">{invoice.customerPhone || '—'}</span></div>
          <div className="inv-field"><span className="label">Address</span><span className="value" style={{ maxWidth: 240, textAlign: 'right' }}>{invoice.customerAddress || '—'}</span></div>

          {/* Current Customer Bottle Status */}
          {cust && (
            <div className="no-print" style={{ marginTop: 14, padding: 10, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>📊 Customer Current Bottle Balance:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>🟢 Total Filled Sold:</span>
                  <div style={{ marginTop: 2 }}>
                    {CYLINDER_TYPES.map(t => `${t}: ${cust.bottleBalance?.[t]?.filledGiven || 0}`).join(' · ')}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>🫙 Pending to Collect:</span>
                  <div style={{ marginTop: 2 }}>
                    {CYLINDER_TYPES.map(t => {
                      const s = cust.emptyBottleStock?.[t] || { withCustomer: 0, collected: 0 };
                      return `${t}: ${Math.max(0, s.withCustomer - s.collected)}`;
                    }).join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="invoice-section no-print">
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
      <div className="card mb-20 invoice-table-card">
        <div className="card-header">
          <span className="card-title">
            {isEB ? '🫙 Empty Bottles Collected' : '📦 Cylinder Items & Billing'}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cylinder Type</th>
                <th>{isEB ? 'Empty Collected' : 'Quantity (Filled)'}</th>
                <th>{isEB ? 'Rate / Credit (₹)' : 'Unit Price (₹)'}</th>
                <th>Amount</th>
                <th>Bottle Status</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-600">{item.cylinderType}</td>
                  <td>{item.qty}</td>
                  <td>₹{(Number(item.unitPrice) || 0).toLocaleString('en-IN')}</td>
                  <td className="fw-600 text-accent">₹{((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}</td>
                  <td>
                    {isEB ? (
                      <span className="badge badge-success">✅ Collected {item.qty} empty</span>
                    ) : (
                      item.emptyCollected
                        ? <span className="badge badge-success">✅ Collected {item.emptyCount !== undefined ? item.emptyCount : item.qty} empty</span>
                        : <span className="badge badge-muted">Not Collected</span>
                    )}
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
              <span>₹{(Number(paidAmount) || 0).toLocaleString('en-IN')}</span>
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

      {/* Bank & Payment Details */}
      {(currentSettings.bankName || currentSettings.upiId) && (
        <div className="card mb-20 bank-details-card">
          <div className="card-header" style={{ padding: '10px 18px', background: 'rgba(234, 88, 12, 0.04)' }}>
            <span className="card-title" style={{ fontSize: '0.88rem' }}>🏦 Bank & Online Payment Details</span>
          </div>
          <div className="card-body" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: '0.82rem' }}>
            <div>
              <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Bank Name</span>
              <strong style={{ color: 'var(--text-primary)' }}>{currentSettings.bankName || 'State Bank of India'}</strong>
            </div>
            <div>
              <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Account Name</span>
              <strong style={{ color: 'var(--text-primary)' }}>{currentSettings.accountHolder || currentSettings.agencyName}</strong>
            </div>
            <div>
              <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Account Number</span>
              <strong style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{currentSettings.accountNumber || '123456789012'}</strong>
            </div>
            <div>
              <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>IFSC Code</span>
              <strong style={{ fontFamily: 'monospace' }}>{currentSettings.ifscCode || 'SBIN0001234'}</strong>
            </div>
            {currentSettings.branch && (
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Branch</span>
                <strong>{currentSettings.branch}</strong>
              </div>
            )}
            {currentSettings.upiId && (
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>UPI VPA</span>
                <strong className="text-accent" style={{ fontFamily: 'monospace' }}>{currentSettings.upiId}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bill Footer & Terms */}
      <div className="card mb-20 invoice-terms-card">
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
          <div>
            {currentSettings.invoiceTerms && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  📋 Terms & Conditions:
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {currentSettings.invoiceTerms}
                </div>
              </div>
            )}
            {currentSettings.invoiceFooterNote && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 8 }}>
                💬 {currentSettings.invoiceFooterNote}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 90 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              For {(currentSettings.agencyName || 'Jaydeep Indian Gas Agency').toUpperCase()}
            </div>
            <div style={{ marginTop: 45, borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: '0.78rem', color: 'var(--text-muted)', width: 180, textAlign: 'center' }}>
              {currentSettings.signatoryTitle || 'Authorized Signatory'}
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Screenshot */}
      {(invoice.notes || invoice.privateNotes || invoice.paymentScreenshot) && (
        <div className="card no-print">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑 Delete Invoice</span>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This will automatically revert the customer's bottle balance and warehouse stock counts associated with this invoice.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
