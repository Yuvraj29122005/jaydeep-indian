import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CYLINDER_TYPES, PAYMENT_MODES } from '../lib/constants';

const blankItem = () => ({ cylinderType: '19kg', qty: 1, unitPrice: 0, emptyCollected: false, emptyCount: 0 });

export default function CreateInvoice() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { customers, createInvoice, editInvoiceFull, getStockByType, invoices } = useApp();
  const navigate = useNavigate();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([blankItem()]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        setSelectedCustomerId(inv.customerId);
        setInvoiceNumber(inv.invoiceNumber);
        setDate(inv.date);
        setItems(inv.items);
        setPaymentMode(inv.paymentMode);
        setPaidAmount(inv.paidAmount);
        setNotes(inv.notes || '');
        setPrivateNotes(inv.privateNotes || '');
        setPaymentScreenshot(inv.paymentScreenshot || '');
      }
    }
  }, [id, invoices, isEditing]);

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setItems(items.map(item => ({
        ...item,
        unitPrice: cust.prices[item.cylinderType] || 0,
      })));
    }
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      if (field === 'cylinderType' && selectedCustomer) {
        updated[idx].unitPrice = selectedCustomer.prices[val] || 0;
      }
      if (field === 'qty') {
        updated[idx].qty = val === '' ? '' : Number(val);
        if (updated[idx].emptyCollected) updated[idx].emptyCount = updated[idx].qty;
      }
      if (field === 'unitPrice') updated[idx].unitPrice = val === '' ? '' : Number(val);
      if (field === 'emptyCount') updated[idx].emptyCount = val === '' ? '' : Number(val);
      if (field === 'emptyCollected') {
        updated[idx].emptyCount = val ? (updated[idx].qty || 1) : 0;
      }
      return updated;
    });
  };

  const addItem = () => {
    const newItem = blankItem();
    if (selectedCustomer) newItem.unitPrice = selectedCustomer.prices[newItem.cylinderType] || 0;
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((s, item) => s + (item.qty * item.unitPrice), 0);
  const balance = totalAmount - (Number(paidAmount) || 0);

  const getPaymentStatus = () => {
    const paid = Number(paidAmount) || 0;
    if (paid <= 0) return 'Unpaid';
    if (paid >= totalAmount) return 'Paid';
    return 'Partial';
  };

  const validate = () => {
    const errs = {};
    if (!invoiceNumber.trim()) errs.invoiceNumber = 'Invoice Number is required';
    if (!selectedCustomerId) errs.customer = 'Please select a customer';
    if (items.length === 0) errs.items = 'Add at least one item';
    items.forEach((item, idx) => {
      const qty = Number(item.qty) || 0;
      const stock = getStockByType(item.cylinderType);
      
      if (qty <= 0) errs[`qty_${idx}`] = 'Min qty 1';
      if (!isEditing && qty > stock.filledCount) {
        errs[`qty_${idx}`] = `Not enough stock! Only ${stock.filledCount} available`;
      }
      if (item.unitPrice === '' || Number(item.unitPrice) < 0) errs[`price_${idx}`] = 'Invalid price';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      alert("Please fix the validation errors (e.g. not enough stock available or empty fields) before creating the invoice.");
      return;
    }
    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      date,
      customerId: selectedCustomerId,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: items.map(item => ({
        ...item,
        qty: Number(item.qty) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        emptyCount: Number(item.emptyCount) || 0
      })),
      totalAmount,
      paidAmount: Number(paidAmount) || 0,
      paymentMode,
      paymentScreenshot,
      paymentStatus: getPaymentStatus(),
      notes,
      privateNotes,
    };
    
    try {
      if (isEditing) {
        await editInvoiceFull(id, payload);
        navigate(`/invoices/${id}`);
      } else {
        const inv = await createInvoice(payload);
        navigate(`/invoices/${inv.id}`);
      }
    } catch (err) {
      alert("Failed to save invoice: " + (err.message || err));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEditing ? '✏️ Edit Invoice' : '➕ Create Invoice'}</h1>
          <p className="page-subtitle">{isEditing ? 'Update existing gas delivery invoice' : 'Generate a new gas delivery invoice'}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>← Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Customer & Date */}
          <div className="card">
            <div className="card-header"><span className="card-title">👤 Customer Details</span></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Invoice Number *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter Invoice Number (e.g. JIG-2026-101)"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                  />
                  {errors.invoiceNumber && <span className="text-danger" style={{ fontSize: '0.78rem' }}>{errors.invoiceNumber}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Select Customer *</label>
                  <select
                    className="form-control"
                    value={selectedCustomerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                    ))}
                  </select>
                  {errors.customer && <span className="text-danger" style={{ fontSize: '0.78rem' }}>{errors.customer}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Date *</label>
                  <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              {selectedCustomer && (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                    <div><span className="text-muted">Phone: </span><strong>{selectedCustomer.phone}</strong></div>
                    <div><span className="text-muted">Type: </span><strong>{selectedCustomer.type}</strong></div>
                    <div className="full" style={{ gridColumn: '1/-1' }}><span className="text-muted">Address: </span><strong>{selectedCustomer.address}</strong></div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {CYLINDER_TYPES.map(t => (
                      <span key={t} className="tag">
                        {t}: <strong className="text-accent">₹{selectedCustomer.prices[t]}</strong>
                      </span>
                    ))}
                  </div>
                  {/* Bottle Balance */}
                  {selectedCustomer.bottleBalance && (
                    <div style={{ marginTop: 12, padding: 10, background: 'rgba(245,158,11,0.06)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>🫙 Current Bottle Balance</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                        {CYLINDER_TYPES.map(t => {
                          const b = selectedCustomer.bottleBalance[t] || { filledGiven: 0, emptyCollected: 0 };
                          const net = b.filledGiven - b.emptyCollected;
                          return net > 0 ? (
                            <span key={t} className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                              {t}: {net} bottles
                            </span>
                          ) : (
                            <span key={t} className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              {t}: 0 balance
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 Cylinder Items</span>
              <button className="btn btn-success btn-sm" onClick={addItem}>➕ Add Item</button>
            </div>
            <div className="card-body">
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px 80px 140px 120px 140px 40px',
                gap: 10, marginBottom: 8,
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <span>Type</span>
                <span>Qty</span>
                <span>Unit Price (₹)</span>
                <span>Amount</span>
                <span>Empty Collected</span>
                <span></span>
              </div>

              {items.map((item, idx) => {
                const stockInfo = getStockByType(item.cylinderType);
                return (
                  <div key={idx} className="invoice-item-row">
                    <select
                      className="form-control"
                      value={item.cylinderType}
                      onChange={e => updateItem(idx, 'cylinderType', e.target.value)}
                    >
                      {CYLINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <div>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                      />
                      <div style={{ fontSize: '0.7rem', color: stockInfo.filledCount < item.qty ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
                        Stock: {stockInfo.filledCount}
                      </div>
                      {errors[`qty_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`qty_${idx}`]}</div>}
                    </div>

                    <div>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                        placeholder="Enter price"
                      />
                      {errors[`price_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`price_${idx}`]}</div>}
                    </div>

                    <div className="fw-600 text-accent">
                      ₹{(item.qty * item.unitPrice).toLocaleString('en-IN')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="checkbox-wrap" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={item.emptyCollected}
                          onChange={e => updateItem(idx, 'emptyCollected', e.target.checked)}
                        />
                        <span className="checkbox-label" style={{ fontSize: '0.8rem' }}>Collect Empty</span>
                      </label>
                      {item.emptyCollected && (
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          value={item.emptyCount}
                          onChange={e => updateItem(idx, 'emptyCount', e.target.value)}
                          placeholder="Count"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: '80%' }}
                        />
                      )}
                    </div>

                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                      ✕
                    </button>
                  </div>
                );
              })}
              {errors.items && <p className="text-danger" style={{ fontSize: '0.78rem', marginTop: 8 }}>{errors.items}</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">📝 Notes</span></div>
            <div className="card-body">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Any special instructions, remarks (visible on print)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="card-header mt-12"><span className="card-title">🔒 Private Description (Admin Only)</span></div>
            <div className="card-body">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Notes only visible to admins..."
                value={privateNotes}
                onChange={e => setPrivateNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>
          {/* Payment */}
          <div className="card">
            <div className="card-header"><span className="card-title">💳 Payment</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {(paymentMode === 'UPI' || paymentMode === 'Bank Transfer') && (
                <div className="form-group">
                  <label className="form-label">Payment Screenshot</label>
                  <input
                    className="form-control"
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    style={{ fontSize: '0.8rem', padding: '6px' }}
                  />
                  {paymentScreenshot && <img src={paymentScreenshot} alt="Screenshot preview" style={{ marginTop: 8, maxHeight: 100, borderRadius: 4, objectFit: 'cover' }} />}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Amount Paid (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">🧮 Summary</span></div>
            <div className="card-body">
              <div className="totals-box" style={{ maxWidth: '100%' }}>
                {items.map((item, idx) => (
                  <div className="total-row" key={idx} style={{ fontSize: '0.82rem' }}>
                    <span className="text-muted">{item.qty}× {item.cylinderType}</span>
                    <span>₹{(item.qty * item.unitPrice).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="total-row grand">
                  <span>Total</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="total-row" style={{ color: 'var(--success)' }}>
                  <span>Paid</span>
                  <span>₹{(Number(paidAmount) || 0).toLocaleString('en-IN')}</span>
                </div>
                {balance > 0 && (
                  <div className="total-row balance">
                    <span>Balance Due</span>
                    <span>₹{balance.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ marginTop: 12, padding: '8px', background: 'var(--accent-light)', borderRadius: 6, fontSize: '0.78rem', textAlign: 'center' }}>
                  Status: <strong className="text-accent">{getPaymentStatus()}</strong>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="fw-600 mb-16" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Empty Bottle Collection:</div>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span>{item.qty}× {item.cylinderType}</span>
                    <span>{item.emptyCollected
                      ? <span className="text-success">✅ Will Collect {item.emptyCount}</span>
                      : <span className="text-muted">— Not collecting</span>
                    }</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 13 }} onClick={handleSubmit}>
                {isEditing ? '💾 Save Changes' : '✅ Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
