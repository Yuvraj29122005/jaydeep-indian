import React, { useState, useEffect, useRef } from 'react';
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
  isNC: false, // New Connection flag
});

export default function CreateInvoice() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const location = useLocation();
  const { customers, createInvoice, editInvoiceFull, getStockByType, invoices, agencySettings, marketPrices } = useApp();
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

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerInputMode, setCustomerInputMode] = useState('select'); // 'select' | 'manual'
  const [manualCustomerName, setManualCustomerName] = useState('');
  const customerSearchRef = useRef(null);
  const customerDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target) &&
          customerSearchRef.current && !customerSearchRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => {
    const s = customerSearch.trim().toLowerCase();
    if (!s) return true;
    return (
      c.name.toLowerCase().includes(s) ||
      (c.phone || '').toLowerCase().includes(s) ||
      (c.address || '').toLowerCase().includes(s)
    );
  });

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setCustomerSearch(cust.name);
      setManualCustomerName('');
    }
    setShowCustomerDropdown(false);
    handleCustomerChange(customerId);
  };

  // Handle URL query parameters for new invoices (e.g. ?type=empty&customer=123)
  useEffect(() => {
    if (!isEditing) {
      const searchParams = new URLSearchParams(location.search);
      const qType = searchParams.get('type');
      const qCust = searchParams.get('customer');

      const isEB = qType === 'empty';
      if (isEB) {
        setInvoiceType('Empty Bottle');
      }
      // Invoice number always blank — user must input manually
      setInvoiceNumber('');

      if (qCust) {
        setSelectedCustomerId(qCust);
        const cust = customers.find(c => c.id === qCust);
        if (cust) {
          setCustomerSearch(cust.name);
          if (isEB) {
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
                  isNC: false,
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
    }
  }, [isEditing, location.search, customers, invoices]);

  // Handle edit mode
  useEffect(() => {
    if (isEditing) {
      const inv = invoices.find(i => i.id === id);
      if (inv) {
        setSelectedCustomerId(inv.customerId);
        const cust = customers.find(c => c.id === inv.customerId);
        if (cust) setCustomerSearch(cust.name);
        setInvoiceType(inv.invoiceType || 'Standard');
        setInvoiceNumber(inv.invoiceNumber);
        setDate(inv.date);
        setItems(inv.items.map(item => ({
          ...item,
          emptyCollected: inv.invoiceType === 'Empty Bottle' ? true : Boolean(item.emptyCollected),
          emptyCount: item.emptyCount !== undefined ? item.emptyCount : (item.emptyCollected ? item.qty : 0),
          itemType: inv.invoiceType === 'Empty Bottle' ? 'empty' : (item.itemType || 'filled'),
          isBottleOnly: inv.invoiceType === 'Empty Bottle' || Boolean(item.isBottleOnly),
          isNC: Boolean(item.isNC),
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
      // Invoice number always blank — user must input manually
      setInvoiceNumber('');

      if (type === 'Empty Bottle') {
        // If selected customer has pending empty bottles, suggest auto-filling
        if (selectedCustomer) {
          autoFillPendingBottles(selectedCustomer);
        } else {
          setItems([blankItem(true)]);
        }
      } else {
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
          isNC: false,
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
        setItems(items.map(item => {
          const mkt = Number(marketPrices?.[item.cylinderType]) || 0;
          const custPrice = cust.prices?.[item.cylinderType] !== undefined && Number(cust.prices[item.cylinderType]) > 0
            ? Number(cust.prices[item.cylinderType])
            : mkt;
          return {
            ...item,
            unitPrice: custPrice,
          };
        }));
      }
    }
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      if (field === 'cylinderType' && selectedCustomer && invoiceType === 'Standard') {
        const mkt = Number(marketPrices?.[val]) || 0;
        const custPrice = selectedCustomer.prices?.[val] !== undefined && Number(selectedCustomer.prices[val]) > 0
          ? Number(selectedCustomer.prices[val])
          : mkt;
        updated[idx].unitPrice = custPrice;
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
      // NC toggle: if NC is enabled, the bottle is permanent (no empty collection needed)
      if (field === 'isNC') {
        updated[idx].isNC = val;
        if (val) {
          // NC bottles: no empty collection expected
          updated[idx].emptyCollected = false;
          updated[idx].emptyCount = 0;
        }
      }
      return updated;
    });
  };

  const addItem = () => {
    const isEB = invoiceType === 'Empty Bottle';
    const newItem = blankItem(isEB);
    if (selectedCustomer && !isEB) {
      const mkt = Number(marketPrices?.[newItem.cylinderType]) || 0;
      const custPrice = selectedCustomer.prices?.[newItem.cylinderType] !== undefined && Number(selectedCustomer.prices[newItem.cylinderType]) > 0
        ? Number(selectedCustomer.prices[newItem.cylinderType])
        : mkt;
      newItem.unitPrice = custPrice;
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
    if (!invoiceNumber.trim()) {
      errs.invoiceNumber = 'Invoice Number is required (enter invoice number manually)';
    } else {
      const trimmed = invoiceNumber.trim().toLowerCase();
      const duplicate = invoices.find(i => (!isEditing || i.id !== id) && (i.invoiceNumber || '').trim().toLowerCase() === trimmed);
      if (duplicate) {
        errs.invoiceNumber = `Invoice Number "${invoiceNumber.trim()}" is already used! Please enter a unique invoice number.`;
      }
    }

    if (!selectedCustomerId && customerInputMode === 'select') errs.customer = 'Please select a customer';
    if (!manualCustomerName.trim() && customerInputMode === 'manual') errs.customer = 'Please enter customer name';
    if (items.length === 0) errs.items = 'Add at least one item';

    // Variety-wise total stock check
    if (invoiceType === 'Standard' && !isEditing) {
      const requestedByType = {};
      items.forEach(item => {
        if (item.itemType !== 'empty' && !item.isBottleOnly) {
          requestedByType[item.cylinderType] = (requestedByType[item.cylinderType] || 0) + (Number(item.qty) || 0);
        }
      });
      CYLINDER_TYPES.forEach(t => {
        const available = getStockByType(t).filledCount;
        const req = requestedByType[t] || 0;
        if (req > available) {
          errs.items = `Total requested ${t} filled cylinders (${req}) exceeds available warehouse stock (${available})!`;
        }
      });
    }

    items.forEach((item, idx) => {
      const qty = Number(item.qty) || 0;
      if (qty <= 0) errs[`qty_${idx}`] = 'Min qty 1';

      if (invoiceType === 'Standard') {
        const stock = getStockByType(item.cylinderType);
        if (!isEditing && qty > stock.filledCount) {
          errs[`qty_${idx}`] = `Not enough stock! Only ${stock.filledCount} available`;
        }
      }

      if (invoiceType === 'Standard') {
        if (item.unitPrice === '' || Number(item.unitPrice) < 0) {
          errs[`price_${idx}`] = 'Invalid price';
        }
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
      customerId: selectedCustomerId || 'manual',
      customerName: selectedCustomer ? selectedCustomer.name : manualCustomerName.trim(),
      customerPhone: selectedCustomer ? selectedCustomer.phone : '',
      customerAddress: selectedCustomer ? (selectedCustomer.address || '') : '',
      items: items.map(item => {
        const itemQty = Number(item.qty) || 1;
        return {
          ...item,
          cylinderType: item.cylinderType,
          qty: itemQty,
          unitPrice: isEB ? 0 : (Number(item.unitPrice) || 0),
          emptyCollected: item.isNC ? false : (isEB ? true : Boolean(item.emptyCollected)),
          emptyCount: item.isNC ? 0 : (isEB ? itemQty : (Boolean(item.emptyCollected) ? (Number(item.emptyCount) || itemQty) : 0)),
          itemType: isEB ? 'empty' : 'filled',
          isBottleOnly: isEB,
          isNC: Boolean(item.isNC),
        };
      }),
      totalAmount: isEB ? 0 : totalAmount,
      paidAmount: isEB ? 0 : (Number(paidAmount) || 0),
      paymentMode: isEB ? 'N/A' : paymentMode,
      paymentScreenshot: isEB ? '' : paymentScreenshot,
      paymentStatus: isEB ? 'Paid' : getPaymentStatus(),
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
    if (item.isNC) return sum; // NC bottles don't count as empty collection
    if (invoiceType === 'Empty Bottle') return sum + (Number(item.qty) || 0);
    if (item.emptyCollected) return sum + (Number(item.emptyCount) || Number(item.qty) || 0);
    return sum;
  }, 0);

  // Count total NC bottles in this invoice
  const totalNCBottles = items.reduce((sum, item) => {
    if (item.isNC) return sum + (Number(item.qty) || 0);
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

      <div className="create-invoice-grid">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Invoice Number *</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Required · Enter manually</span>
                  </div>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter Invoice Number (e.g. 101, INV-001)..."
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    style={{ fontWeight: 700, fontSize: '0.95rem' }}
                  />
                  {errors.invoiceNumber && <span className="text-danger" style={{ fontSize: '0.78rem', marginTop: 4, display: 'block' }}>{errors.invoiceNumber}</span>}
                </div>

                {/* Customer Input Mode Toggle */}
                <div className="form-group full">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Customer *</label>
                    <div style={{
                      display: 'flex', background: 'var(--bg-primary)', borderRadius: 6,
                      border: '1px solid var(--border)', overflow: 'hidden', fontSize: '0.72rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => { setCustomerInputMode('select'); setManualCustomerName(''); }}
                        style={{
                          padding: '4px 10px', border: 'none', cursor: 'pointer', fontWeight: 600,
                          background: customerInputMode === 'select' ? 'var(--accent)' : 'transparent',
                          color: customerInputMode === 'select' ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                      >
                        🔍 Select
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCustomerInputMode('manual'); setSelectedCustomerId(''); setCustomerSearch(''); }}
                        style={{
                          padding: '4px 10px', border: 'none', cursor: 'pointer', fontWeight: 600,
                          background: customerInputMode === 'manual' ? 'var(--accent)' : 'transparent',
                          color: customerInputMode === 'manual' ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✏️ Manual
                      </button>
                    </div>
                  </div>

                  {customerInputMode === 'select' ? (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          fontSize: '0.9rem', pointerEvents: 'none', zIndex: 1
                        }}>🔍</span>
                        <input
                          ref={customerSearchRef}
                          className="form-control"
                          type="text"
                          placeholder="Search by name, phone, or address..."
                          value={customerSearch}
                          onChange={e => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                            if (!e.target.value.trim()) {
                              setSelectedCustomerId('');
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          style={{ paddingLeft: 34, fontWeight: selectedCustomer ? 700 : 400 }}
                        />
                        {selectedCustomer && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerSearch('');
                              setSelectedCustomerId('');
                              setShowCustomerDropdown(true);
                            }}
                            style={{
                              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: '0.85rem', color: 'var(--text-muted)', padding: '4px'
                            }}
                            title="Clear selection"
                          >✕</button>
                        )}
                      </div>

                      {showCustomerDropdown && (
                        <div ref={customerDropdownRef} style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: '#fff', border: '1px solid var(--border)',
                          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          maxHeight: 260, overflowY: 'auto', zIndex: 100, marginTop: 4
                        }}>
                          {filteredCustomers.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              No customers found matching "{customerSearch}"
                            </div>
                          ) : (
                            filteredCustomers.map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleCustomerSelect(c.id)}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--border)',
                                  background: selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent',
                                  transition: 'background 0.15s',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent'}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                    {c.name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    📞 {c.phone} • {c.type}
                                    {c.address && ` • 📍 ${c.address.substring(0, 40)}${c.address.length > 40 ? '...' : ''}`}
                                  </div>
                                </div>
                                {selectedCustomerId === c.id && (
                                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>✓</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Enter customer name manually..."
                      value={manualCustomerName}
                      onChange={e => setManualCustomerName(e.target.value)}
                      style={{ fontWeight: 600 }}
                    />
                  )}
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

                  {/* ==================== CUSTOMER PRICING SUMMARY CARD ==================== */}
                  {invoiceType === 'Standard' && (
                    <div style={{
                      marginTop: 14, padding: 12,
                      background: 'linear-gradient(135deg, rgba(234,88,12,0.04) 0%, rgba(249,115,22,0.08) 100%)',
                      borderRadius: 8,
                      border: '1px solid rgba(234,88,12,0.18)',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 10
                      }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary, #ea580c)' }}>
                          💰 Customer Pricing (Auto-Applied)
                        </div>
                        {CYLINDER_TYPES.some(t => {
                          const mkt = Number(marketPrices?.[t]) || 0;
                          const cp = Number(selectedCustomer.prices?.[t]) || mkt;
                          return cp < mkt;
                        }) && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700,
                            color: '#16a34a', background: 'rgba(34,197,94,0.1)',
                            padding: '2px 8px', borderRadius: 20,
                          }}>🏷️ Discounted Customer</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                        {CYLINDER_TYPES.map(t => {
                          const mkt = Number(marketPrices?.[t]) || 0;
                          const custPrice = Number(selectedCustomer.prices?.[t]) || mkt;
                          const discountAmt = mkt - custPrice;
                          const discountPct = mkt > 0 ? ((discountAmt / mkt) * 100).toFixed(1) : 0;
                          const hasDiscount = discountAmt > 0;

                          return (
                            <div key={t} style={{
                              padding: '8px 10px', borderRadius: 6,
                              background: hasDiscount ? 'rgba(34,197,94,0.06)' : 'var(--bg-card)',
                              border: `1px solid ${hasDiscount ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                              textAlign: 'center',
                            }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                                {t}
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                ₹{custPrice.toLocaleString('en-IN')}
                              </div>
                              {hasDiscount ? (
                                <>
                                  <div style={{
                                    fontSize: '0.68rem', color: 'var(--text-muted)',
                                    textDecoration: 'line-through', marginTop: 2
                                  }}>
                                    MRP ₹{mkt.toLocaleString('en-IN')}
                                  </div>
                                  <div style={{
                                    display: 'flex', gap: 4, justifyContent: 'center',
                                    alignItems: 'center', marginTop: 3
                                  }}>
                                    <span style={{
                                      fontSize: '0.65rem', fontWeight: 700, color: '#16a34a',
                                      background: 'rgba(34,197,94,0.12)', padding: '1px 6px',
                                      borderRadius: 10
                                    }}>
                                      -{discountPct}%
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600 }}>
                                      Save ₹{discountAmt.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  Market Price
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

                  {/* NC Bottles info */}
                  {selectedCustomer.ncBottles && (
                    <div style={{ marginTop: 10, padding: 10, background: 'rgba(139,92,246,0.06)', borderRadius: 6, border: '1px solid rgba(139,92,246,0.2)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>
                        🏠 NC (New Connection) Bottles — Permanently Owned
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        {CYLINDER_TYPES.map(t => {
                          const nc = selectedCustomer.ncBottles?.[t] || 0;
                          return nc > 0 ? <span key={t} className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#7c3aed' }}>{t}: {nc}</span> : null;
                        })}
                        {CYLINDER_TYPES.every(t => !(selectedCustomer.ncBottles?.[t])) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No NC bottles yet</span>
                        )}
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
              <span className="card-title">
                {invoiceType === 'Empty Bottle' ? '🫙 Empty Bottles Being Collected' : '📦 Cylinder Items'}
              </span>
              <button className="btn btn-success btn-sm" onClick={addItem}>➕ Add Item</button>
            </div>
            <div className="card-body">
              <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', paddingBottom: 6 }}>
                <div style={{ minWidth: invoiceType === 'Empty Bottle' ? 560 : 720 }}>
                  {/* Header row */}
                  <div style={{
                display: 'grid',
                gridTemplateColumns: invoiceType === 'Empty Bottle'
                  ? '180px 140px 1fr 40px'
                  : '130px 80px 120px 100px 80px 140px 40px',
                gap: 10, marginBottom: 8,
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {invoiceType === 'Empty Bottle' ? (
                  <>
                    <span>Cylinder Variety</span>
                    <span>Empties Collected</span>
                    <span>Warehouse Stock & Customer Balance Impact</span>
                    <span></span>
                  </>
                ) : (
                  <>
                    <span>Type</span>
                    <span>Qty (Filled)</span>
                    <span>Unit Price (₹)</span>
                    <span>Amount</span>
                    <span>NC</span>
                    <span>Empty Collected</span>
                    <span></span>
                  </>
                )}
              </div>

              {items.map((item, idx) => {
                const stockInfo = getStockByType(item.cylinderType);
                const custTypeStock = custStock[item.cylinderType] || { withCustomer: 0, collected: 0 };
                const netCustPending = Math.max(0, custTypeStock.withCustomer - custTypeStock.collected);

                return (
                  <div key={idx} className="invoice-item-row" style={{
                    display: 'grid',
                    gridTemplateColumns: invoiceType === 'Empty Bottle'
                      ? '180px 140px 1fr 40px'
                      : '130px 80px 120px 100px 80px 140px 40px',
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
                      {invoiceType === 'Standard' && (
                        <div style={{ fontSize: '0.7rem', color: stockInfo.filledCount < item.qty ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
                          Stock: {stockInfo.filledCount}
                        </div>
                      )}
                      {errors[`qty_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`qty_${idx}`]}</div>}
                    </div>

                    {invoiceType === 'Empty Bottle' ? (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                          🟢 Warehouse Empty: {stockInfo.emptyCount} (+{Number(item.qty) || 0} to stock)
                        </span>
                        {selectedCustomer && (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                            👥 Customer Holding: {netCustPending} pending
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Unit Price / Rate with Discount Info */}
                        <div>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                            placeholder="₹0"
                            style={{
                              borderColor: (() => {
                                if (!selectedCustomer) return undefined;
                                const mkt = Number(marketPrices?.[item.cylinderType]) || 0;
                                const cp = Number(item.unitPrice) || 0;
                                return mkt > 0 && cp < mkt ? 'rgba(34,197,94,0.5)' : undefined;
                              })()
                            }}
                          />
                          {/* Discount indicator below price */}
                          {selectedCustomer && (() => {
                            const mkt = Number(marketPrices?.[item.cylinderType]) || 0;
                            const cp = Number(item.unitPrice) || 0;
                            const discAmt = mkt - cp;
                            const discPct = mkt > 0 ? ((discAmt / mkt) * 100).toFixed(1) : 0;
                            if (mkt > 0 && discAmt > 0) {
                              return (
                                <div style={{
                                  display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3, alignItems: 'center'
                                }}>
                                  <span style={{
                                    fontSize: '0.62rem', color: 'var(--text-muted)',
                                    textDecoration: 'line-through'
                                  }}>₹{mkt}</span>
                                  <span style={{
                                    fontSize: '0.58rem', fontWeight: 700, color: '#16a34a',
                                    background: 'rgba(34,197,94,0.1)', padding: '0px 4px',
                                    borderRadius: 8, lineHeight: '14px'
                                  }}>-{discPct}%</span>
                                </div>
                              );
                            } else if (mkt > 0 && cp === mkt) {
                              return (
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  MRP ₹{mkt}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {errors[`price_${idx}`] && <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>{errors[`price_${idx}`]}</div>}
                        </div>

                        {/* Amount */}
                        <div className="fw-600 text-accent">
                          ₹{((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}
                        </div>

                        {/* NC Toggle for Standard Invoice */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <label className="checkbox-wrap" style={{ margin: 0 }} title="New Connection — bottle permanently belongs to customer, no empty return expected">
                            <input
                              type="checkbox"
                              checked={item.isNC || false}
                              onChange={e => updateItem(idx, 'isNC', e.target.checked)}
                            />
                            <span className="checkbox-label" style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: item.isNC ? '#7c3aed' : 'var(--text-muted)'
                            }}>NC</span>
                          </label>
                          {item.isNC && (
                            <span style={{
                              fontSize: '0.6rem', color: '#7c3aed', fontWeight: 600,
                              background: 'rgba(139,92,246,0.1)', padding: '1px 6px',
                              borderRadius: 4, marginTop: 2
                            }}>Permanent</span>
                          )}
                        </div>

                        {/* Empty Collected Checkbox for Standard Invoice */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {item.isNC ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No empty return
                            </span>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </>
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
                </div>
              </div>
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
        <div className="create-invoice-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {invoiceType === 'Standard' ? (
            <>
              {/* Payment Details for Standard Invoices */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">💳 Payment Details</span>
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

              {/* Monetary Summary for Standard Invoices */}
              <div className="card">
                <div className="card-header"><span className="card-title">🧮 Invoice Summary</span></div>
                <div className="card-body">
                  <div className="totals-box" style={{ maxWidth: '100%' }}>
                    {items.map((item, idx) => (
                      <div className="total-row" key={idx} style={{ fontSize: '0.82rem' }}>
                        <span className="text-muted">
                          {item.qty}× {item.cylinderType}
                          {item.isNC && <span style={{ color: '#7c3aed', fontWeight: 700 }}> [NC]</span>}
                        </span>
                        <span>₹{((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="total-row grand">
                      <span>Total Amount</span>
                      <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {/* Total Savings from customer discount */}
                    {selectedCustomer && (() => {
                      const totalSavings = items.reduce((sum, item) => {
                        const mkt = Number(marketPrices?.[item.cylinderType]) || 0;
                        const cp = Number(item.unitPrice) || 0;
                        const qty = Number(item.qty) || 0;
                        return sum + Math.max(0, (mkt - cp) * qty);
                      }, 0);
                      if (totalSavings > 0) {
                        return (
                          <div className="total-row" style={{
                            color: '#16a34a',
                            background: 'rgba(34,197,94,0.06)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            marginTop: 4,
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              🏷️ Customer Savings
                            </span>
                            <span style={{ fontWeight: 700 }}>₹{totalSavings.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="total-row" style={{ color: 'var(--success)' }}>
                      <span>Paid Amount</span>
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
                      🫙 Empty Bottle Collection on Delivery:
                    </div>
                    {items.map((item, idx) => {
                      const emptyCount = item.isNC ? 0 : (item.emptyCollected ? (Number(item.emptyCount) || Number(item.qty) || 0) : 0);

                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                          <span>
                            {item.cylinderType}
                            {item.isNC && <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 4 }}>[NC]</span>}
                          </span>
                          <span>
                            {item.isNC ? (
                              <strong style={{ color: '#7c3aed' }}>🏠 Permanent (no return)</strong>
                            ) : emptyCount > 0 ? (
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
                    {totalNCBottles > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginTop: 4 }}>
                        <span>🏠 NC Bottles (Permanent):</span>
                        <span style={{ color: '#7c3aed' }}>{totalNCBottles} bottles</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 20, padding: 13, fontWeight: 700 }}
                    onClick={handleSubmit}
                  >
                    {isEditing ? '💾 Save Changes' : '✅ Create Refill Invoice'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* EMPTY BOTTLE SUMMARY — PURE BOTTLE RECEIPT, NO MONEY */
            <div className="card">
              <div className="card-header">
                <span className="card-title">🫙 Bottle Collection Receipt</span>
              </div>
              <div className="card-body">
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                  lineHeight: 1.4
                }}>
                  📄 <strong>Non-Monetary Receipt:</strong> This receipt records empty cylinders returned by the customer. No monetary charges or payments are required.
                </div>

                <div className="totals-box" style={{ maxWidth: '100%', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Cylinders Being Collected:
                  </div>
                  {items.map((item, idx) => (
                    <div className="total-row" key={idx} style={{ fontSize: '0.88rem', padding: '6px 0' }}>
                      <span className="fw-600">
                        {item.cylinderType} Cylinder
                      </span>
                      <span className="fw-700 text-success" style={{ fontSize: '1rem' }}>
                        +{Number(item.qty) || 0} bottles
                      </span>
                    </div>
                  ))}
                  <div className="total-row grand" style={{ marginTop: 10, borderTop: '2px solid var(--border)' }}>
                    <span>Total Empties Collected</span>
                    <span style={{ color: 'var(--success)', fontSize: '1.2rem', fontWeight: 800 }}>
                      {totalEmptyInInvoice} Cylinders
                    </span>
                  </div>
                </div>

                {/* Warehouse Stock Impact */}
                <div style={{
                  padding: 12,
                  background: 'rgba(34, 197, 94, 0.06)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.82rem'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>
                    🏢 Warehouse Stock Credit:
                  </div>
                  <div>
                    • <strong>+{totalEmptyInInvoice} empty cylinders</strong> will be immediately credited to your warehouse empty stock upon saving.
                  </div>
                </div>

                {/* Customer Holding Impact */}
                {selectedCustomer && (
                  <div style={{
                    padding: 12,
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    fontSize: '0.82rem',
                    marginBottom: 16
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      👤 Customer Pending Balance Impact:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-muted">Previous Pending:</span>
                      <strong>{totalPendingEmpty} bottles</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--success)' }}>
                      <span>Collected Today:</span>
                      <strong>-{totalEmptyInInvoice} bottles</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed var(--border)', fontWeight: 700 }}>
                      <span>Remaining with Customer:</span>
                      <span style={{ color: Math.max(0, totalPendingEmpty - totalEmptyInInvoice) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {Math.max(0, totalPendingEmpty - totalEmptyInInvoice)} bottles
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-success"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
                  }}
                  onClick={handleSubmit}
                >
                  ✓ Record Empty Bottle Collection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
