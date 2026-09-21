import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CYLINDER_TYPES, PAYMENT_MODES, defaultEmptyStock } from '../lib/constants';

const blankItem = (isEB = false) => ({
  cylinderType: '19kg',
  qty: 1,
  unitPrice: 0,
  emptyCollected: isEB,
  emptyCount: isEB ? 1 : 0,
  itemType: isEB ? 'empty' : 'filled',
  isBottleOnly: isEB,
});

export default function CreateInvoice() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const location = useLocation();
  const { customers, createInvoice, editInvoiceFull, getStockByType, invoices } = useApp();
  const navigate = useNavigate();

  const [invoiceType, setInvoiceType] = useState('Standard');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([blankItem(false)]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [errors, setErrors] = useState({});

  // Handle URL query parameters for new invoices (e.g. ?type=empty&customer=123)
  useEffect(() => {
    if (!isEditing) {
      const searchParams = new URLSearchParams(location.search);
      const qType = searchParams.get('type');
      const qCust = searchParams.get('customer');

      const isEB = qType === 'empty';
      if (isEB) {
        setInvoiceType('Empty Bottle');
        const count = invoices.filter(i => i.invoiceType === 'Empty Bottle' || i.invoiceNumber?.startsWith('EB-')).length + 1;
        setInvoiceNumber(`EB-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`);
      } else {
        const count = invoices.length + 1;
        setInvoiceNumber(`JIG-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`);
      }

      if (qCust) {
        setSelectedCustomerId(qCust);
        const cust = customers.find(c => c.id === qCust);
        if (cust && isEB) {
          const stock = cust.emptyBottleStock || defaultEmptyStock();
          const pendingItems = [];
          CYLINDER_TYPES.forEach(t => {
            const s = stock[t] || { withCustomer: 0, collected: 0 };
            const net = Math.max(0, s.withCustomer - s.collected);
            if (net > 0) {
              pendingItems.push({
                cylinderType: t,
                qty: net,
                unitPrice: 0,
                emptyCollected: true,
                emptyCount: net,
                itemType: 'empty',
                isBottleOnly: true,
              });
            }
          });
          if (pendingItems.length > 0) {
            setItems(pendingItems);
          } else {
            setItems([blankItem(true)]);
          }
        }
      }
    }
  }, [isEditing, location.search, customers, invoices]);

  // Handle edit mode
  useEffect(() => {
    if (isEditing) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        setSelectedCustomerId(inv.customerId);
        setInvoiceType(inv.invoiceType || 'Standard');
        setInvoiceNumber(inv.invoiceNumber);
        setDate(inv.date);
        setItems(inv.items.map(item => ({
          ...item,
          emptyCollected: inv.invoiceType === 'Empty Bottle' ? true : Boolean(item.emptyCollected),
          emptyCount: item.emptyCount !== undefined ? item.emptyCount : (item.emptyCollected ? item.qty : 0),
          itemType: inv.invoiceType === 'Empty Bottle' ? 'empty' : (item.itemType || 'filled'),
          isBottleOnly: inv.invoiceType === 'Empty Bottle' || Boolean(item.isBottleOnly),
        })));
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

  const handleTypeChange = (type) => {
    if (type === invoiceType) return;
    setInvoiceType(type);

    if (!isEditing) {
      if (type === 'Empty Bottle') {
        const count = invoices.filter(i => i.invoiceType === 'Empty Bottle' || i.invoiceNumber?.startsWith('EB-')).length + 1;
        setInvoiceNumber(`EB-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`);
        // If selected customer has pending empty bottles, suggest auto-filling
        if (selectedCustomer) {
          autoFillPendingBottles(selectedCustomer);
        } else {
          setItems([blankItem(true)]);
        }
      } else {
        const count = invoices.length + 1;
        setInvoiceNumber(`JIG-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`);
        setItems([blankItem(false)]);
      }
    }
  };

  const autoFillPendingBottles = (cust) => {
    const customerObj = cust || selectedCustomer;
    if (!customerObj) return;
    const stock = customerObj.emptyBottleStock || defaultEmptyStock();
    const pendingItems = [];
    CYLINDER_TYPES.forEach(t => {
      const s = stock[t] || { withCustomer: 0, collected: 0 };
      const net = Math.max(0, s.withCustomer - s.collected);
      if (net > 0) {
        pendingItems.push({
          cylinderType: t,
          qty: net,
          unitPrice: 0,
          emptyCollected: true,
          emptyCount: net,
          itemType: 'empty',
          isBottleOnly: true,
        });
      }
    });

    if (pendingItems.length > 0) {
      setItems(pendingItems);
    } else {
      setItems([blankItem(true)]);
    }
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      if (invoiceType === 'Empty Bottle') {
        autoFillPendingBottles(cust);
      } else {
        setItems(items.map(item => ({
          ...item,
          unitPrice: cust.prices[item.cylinderType] || 0,
        })));
      }
    }
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      if (field === 'cylinderType' && selectedCustomer && invoiceType === 'Standard') {
        updated[idx].unitPrice = selectedCustomer.prices[val] || 0;
      }
      if (field === 'qty') {
        const numVal = val === '' ? '' : Number(val);
        updated[idx].qty = numVal;
        if (invoiceType === 'Empty Bottle' || updated[idx].emptyCollected) {
          updated[idx].emptyCount = numVal;
        }
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
    const isEB = invoiceType === 'Empty Bottle';
    const newItem = blankItem(isEB);
    if (selectedCustomer && !isEB) {
      newItem.unitPrice = selectedCustomer.prices[newItem.cylinderType] || 0;
    }
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((s, item) => s + ((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)), 0);
  const balance = totalAmount - (Number(paidAmount) || 0);

  const getPaymentStatus = () => {
    if (invoiceType === 'Empty Bottle' && totalAmount === 0) {
      return 'Paid';
    }
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
      if (qty <= 0) errs[`qty_${idx}`] = 'Min qty 1';

      if (invoiceType === 'Standard') {
        const stock = getStockByType(item.cylinderType);
        if (!isEditing && qty > stock.filledCount) {
          errs[`qty_${idx}`] = `Not enough stock! Only ${stock.filledCount} available`;
        }
      }

      if (item.unitPrice === '' || Number(item.unitPrice) < 0) {
        errs[`price_${idx}`] = 'Invalid price';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      alert("Please fix the validation errors (e.g. not enough stock or missing fields) before submitting.");
      return;
    }

    const isEB = invoiceType === 'Empty Bottle';

    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      invoiceType,
      date,
      customerId: selectedCustomerId,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address || '',
      items: items.map(item => {
        const itemQty = Number(item.qty) || 1;
        return {
          ...item,
          cylinderType: item.cylinderType,
          qty: itemQty,
          unitPrice: Number(item.unitPrice) || 0,
          emptyCollected: isEB ? true : Boolean(item.emptyCollected),
          emptyCount: isEB ? itemQty : (Boolean(item.emptyCollected) ? (Number(item.emptyCount) || itemQty) : 0),
          itemType: isEB ? 'empty' : 'filled',
          isBottleOnly: isEB,
        };
      }),
      totalAmount,
      paidAmount: isEB && totalAmount === 0 ? 0 : (Number(paidAmount) || 0),
      paymentMode,
      paymentScreenshot,
      paymentStatus: getPaymentStatus(),
      deliveryStatus: isEB ? 'Collected' : 'Pending',
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

  // Calculate customer's pending bottle balance
  const custStock = selectedCustomer?.emptyBottleStock || defaultEmptyStock();
  const totalPendingEmpty = CYLINDER_TYPES.reduce((sum, t) => {
    const s = custStock[t] || { withCustomer: 0, collected: 0 };
    return sum + Math.max(0, s.withCustomer - s.collected);
  }, 0);

  const totalEmptyInInvoice = items.reduce((sum, item) => {
    if (invoiceType === 'Empty Bottle') return sum + (Number(item.qty) || 0);
    if (item.emptyCollected) return sum + (Number(item.emptyCount) || Number(item.qty) || 0);
    return sum;
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEditing
              ? `✏️ Edit ${invoiceType} Invoice`
              : invoiceType === 'Empty Bottle'
                ? '🫙 Create Empty Bottle Invoice'
                : '➕ Create Refill Invoice'
            }
          </h1>
          <p className="page-subtitle">
            {invoiceType === 'Empty Bottle'
              ? 'Record collected empty bottles from customer and immediately update warehouse stock and customer status'
              : 'Generate delivery invoice for filled gas cylinders and optionally collect empty bottles'
            }
          </p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>← Back</button>
        </div>
      </div>

      {/* Invoice Type Selector Buttons */}
      {!isEditing && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 20,
          background: 'var(--bg-card)', padding: '6px', borderRadius: 12,
          border: '1px solid var(--border)', maxWidth: 540
        }}>
          <button
            type="button"
            onClick={() => handleTypeChange('Standard')}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
              background: invoiceType === 'Standard' ? 'var(--primary, #ea580c)' : 'transparent',
              color: invoiceType === 'Standard' ? '#fff' : 'var(--text-secondary)',
              boxShadow: invoiceType === 'Standard' ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none'
            }}
          >
            <span>🟢</span> Standard Refill Invoice
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('Empty Bottle')}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
              background: invoiceType === 'Empty Bottle' ? '#3b82f6' : 'transparent',
              color: invoiceType === 'Empty Bottle' ? '#fff' : 'var(--text-secondary)',
              boxShadow: invoiceType === 'Empty Bottle' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            <span>🫙</span> Empty Bottle Invoice
          </button>
        </div>
      )}

      {invoiceType === 'Empty Bottle' && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: '1.4rem' }}>🫙</span>
          <div>
            <strong>Empty Bottle Collection Mode:</strong> This invoice will directly reduce the customer's pending empty bottle balance and increase the agency's empty bottle warehouse stock.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Customer & Date */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">👤 Customer Details</span>
              {selectedCustomer && invoiceType === 'Empty Bottle' && totalPendingEmpty > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => autoFillPendingBottles(selectedCustomer)}
                  title="Auto-fill empty bottle items based on pending count"
                >
                  ⚡ Auto-fill Pending ({totalPendingEmpty})
                </button>
              )}
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Invoice Number *</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter Invoice Number"
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

                  {/* Bottle Status overview */}
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Filled Sold */}
                    <div style={{ padding: 10, background: 'rgba(34,197,94,0.06)', borderRadius: 6, border: '1px solid rgba(34,197,94,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                        🟢 Total Filled Cylinders Sold
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {CYLINDER_TYPES.map(t => {
                          const b = selectedCustomer.bottleBalance?.[t] || { filledGiven: 0 };
                          return <span key={t} className="badge badge-success">{t}: {b.filledGiven || 0}</span>;
                        })}
                      </div>
                    </div>

                    {/* Empty to collect */}
                    <div style={{ padding: 10, background: totalPendingEmpty > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', borderRadius: 6, border: totalPendingEmpty > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: totalPendingEmpty > 0 ? 'var(--danger)' : 'var(--success)', marginBottom: 4 }}>
                        🫙 Pending Empty Bottles to Collect
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {CYLINDER_TYPES.map(t => {
                          const s = custStock[t] || { withCustomer: 0, collected: 0 };
                          const net = Math.max(0, s.withCustomer - s.collected);
                          return (
                            <span key={t} className={`badge ${net > 0 ? 'badge-danger' : 'badge-success'}`}>
                              {t}: {net}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                {invoiceType === 'Empty Bottle' ? '🫙 Empty Bottles Being Collected' : '📦 Cylinder Items'}
              </span>
              <button className="btn btn-success btn-sm" onClick={addItem}>➕ Add Item</button>
            </div>
            <div className="card-body">
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: invoiceType === 'Empty Bottle'
                  ? '160px 140px 130px 110px 40px'
                  : '150px 80px 140px 120px 140px 40px',
                gap: 10, marginBottom: 8,
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <span>Type</span>
                <span>{invoiceType === 'Empty Bottle' ? 'Empty Bottles Collected' : 'Qty (Filled)'}</span>
                <span>{invoiceType === 'Empty Bottle' ? 'Rate / Credit (₹)' : 'Unit Price (₹)'}</span>
                <span>Amount</span>
                {invoiceType === 'Standard' && <span>Empty Collected</span>}
                <span></span>
              </div>

              {items.map((item, idx) => {
                const stockInfo = getStockByType(item.cylinderType);
                const custTypeStock = custStock[item.cylinderType] || { withCustomer: 0, collected: 0 };
                const netCustPending = Math.max(0, custTypeStock.withCustomer - custTypeStock.collected);

                return (
                  <div key={idx} className="invoice-item-row" style={{
                    display: 'grid',
                    gridTemplateColumns: invoiceType === 'Empty Bottle'
                      ? '160px 140px 130px 110px 40px'
                      : '150px 80px 140px 120px 140px 40px',
                    gap: 10, alignItems: 'center', marginBottom: 12
                  }}>
                    <select
                      className="form-control"
                      value={item.cylinderType}
                      onChange={e => updateItem(idx, 'cylinderType', e.target.value)}
                    >
                      {CYLINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Quantity or Empty Count */}
                    <div>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                        placeholder="Count"
                      />
                      {invoiceType === 'Standard' ? (
                        <div style={{ fontSize: '0.7rem', color: stockInfo.filledCount < item.qty ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
                          Stock: {stockInfo.filledCount}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 2 }}>
                          Empty Stock: {stockInfo.emptyCount} (+{Number(item.qty) || 0})
                          {selectedCustomer && (
                            <span style={{ color: 'var(--text-secondary)', display: 'block' }}>
                              Pending: {netCustPending}
                            </span>
                          )}
                        </div>
                      )}
                      {errors[`qty_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`qty_${idx}`]}</div>}
                    </div>

                    {/* Unit Price / Rate */}
                    <div>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                        placeholder="₹0"
                      />
                      {invoiceType === 'Empty Bottle' && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          ₹0 for normal receipt
                        </div>
                      )}
                      {errors[`price_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`price_${idx}`]}</div>}
                    </div>

                    {/* Amount */}
                    <div className="fw-600 text-accent">
                      ₹{((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}
                    </div>

                    {/* Empty Collected Checkbox for Standard Invoice */}
                    {invoiceType === 'Standard' && (
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
                        {selectedCustomer && netCustPending > 0 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--danger)' }}>
                            Pending: {netCustPending}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      title="Remove item"
                    >
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
                placeholder="Any special remarks or receipt instructions..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="card-header mt-12"><span className="card-title">🔒 Private Description (Admin Only)</span></div>
            <div className="card-body">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Internal notes only visible to staff..."
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
            <div className="card-header">
              <span className="card-title">💳 {invoiceType === 'Empty Bottle' ? 'Receipt & Payment' : 'Payment'}</span>
            </div>
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
                  placeholder={totalAmount === 0 ? "0" : "0"}
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
                    <span className="text-muted">
                      {item.qty}× {item.cylinderType} {invoiceType === 'Empty Bottle' ? '(Empty)' : ''}
                    </span>
                    <span>₹{((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}</span>
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

              {/* Bottle collection status summary */}
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="fw-600 mb-8" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  🫙 Bottle Collection Impact:
                </div>
                {items.map((item, idx) => {
                  const emptyCount = invoiceType === 'Empty Bottle'
                    ? (Number(item.qty) || 0)
                    : (item.emptyCollected ? (Number(item.emptyCount) || Number(item.qty) || 0) : 0);

                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                      <span>{item.cylinderType}</span>
                      <span>
                        {emptyCount > 0 ? (
                          <strong style={{ color: 'var(--success)' }}>✅ Collect {emptyCount}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>— No empty collected</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                  <span>Total Empty Collected:</span>
                  <span style={{ color: 'var(--success)' }}>{totalEmptyInInvoice} bottles</span>
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 20, padding: 13, fontWeight: 700 }}
                onClick={handleSubmit}
              >
                {isEditing ? '💾 Save Changes' : (invoiceType === 'Empty Bottle' ? '✅ Create Empty Bottle Invoice' : '✅ Create Refill Invoice')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
