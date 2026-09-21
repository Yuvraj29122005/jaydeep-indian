import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportCustomersExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CUSTOMER_TYPES = ['Domestic', 'Commercial', 'Hotel', 'Industrial'];
const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };

const emptyForm = {
  name: '', phone: '', address: '', type: 'Domestic',
  prices: { '5kg': 450, '19kg': 950, '47.5kg': 2200 }
};

const defaultBalance = () => ({
  '5kg': { filledGiven: 0, emptyCollected: 0 },
  '19kg': { filledGiven: 0, emptyCollected: 0 },
  '47.5kg': { filledGiven: 0, emptyCollected: 0 },
});

export default function Customers() {
  const navigate = useNavigate();
  const { customers, addCustomer, updateCustomer, deleteCustomer, updateEmptyBottleStock, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Bottle balance modal — stores customer ID, not the object
  const [balanceModalId, setBalanceModalId] = useState(null);
  const balanceModalCustomer = balanceModalId ? customers.find(c => c.id === balanceModalId) : null;
  
  const defaultEmptyStock = () => ({
    '5kg': { withCustomer: 0, collected: 0 },
    '19kg': { withCustomer: 0, collected: 0 },
    '47.5kg': { withCustomer: 0, collected: 0 },
  });
  
  // Collect empty bottles form
  const [collectForm, setCollectForm] = useState(defaultEmptyStock());
  const [collectSuccess, setCollectSuccess] = useState(false);

  const filtered = customers.filter(c => {
    const searchLower = (search || '').toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(searchLower);
    const phoneMatch = (c.phone || '').includes(searchLower);
    const addressMatch = (c.address || '').toLowerCase().includes(searchLower);
    
    const matchSearch = nameMatch || phoneMatch || addressMatch;
    const matchType = filterType === 'All' || c.type === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (c) => {
    setForm({ name: c.name, phone: c.phone, address: c.address, type: c.type, prices: { ...c.prices } });
    setEditId(c.id);
    setModal('edit');
  };

  const openView = (c) => {
    navigate(`/customers/${c.id}`);
  };

  const openBalanceModal = (c) => {
    setCollectForm(defaultEmptyStock());
    setCollectSuccess(false);
    setBalanceModalId(c.id);
  };

  const submitForm = () => {
    if (!form.name || !form.phone) return alert('Name and phone are required');
    if (modal === 'add') {
      addCustomer(form);
    } else {
      updateCustomer(editId, form);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    deleteCustomer(id);
    setDeleteConfirm(null);
  };

  const updatePrice = (type, val) => {
    setForm(f => ({ ...f, prices: { ...f.prices, [type]: Number(val) } }));
  };



  const updateCollectField = (cylType, field, val) => {
    setCollectForm(prev => ({
      ...prev,
      [cylType]: {
        ...prev[cylType],
        [field]: Math.max(0, Number(val) || 0)
      }
    }));
  };

  const collectEmptyBottles = async () => {
    if (!balanceModalCustomer) return;
    
    // Merge collectForm into the existing emptyBottleStock
    const stock = balanceModalCustomer.emptyBottleStock || defaultEmptyStock();
    const updated = JSON.parse(JSON.stringify(stock));
    
    let hasChanges = false;
    CYLINDER_TYPES.forEach(t => {
      if (collectForm[t].withCustomer > 0 || collectForm[t].collected > 0) {
        hasChanges = true;
        const cur = updated[t] || { withCustomer: 0, collected: 0 };
        updated[t] = {
          withCustomer: cur.withCustomer + collectForm[t].withCustomer,
          collected: cur.collected + collectForm[t].collected
        };
      }
    });
    
    if (!hasChanges) return alert('Please enter at least one bottle count.');
    
    try {
      await updateEmptyBottleStock(balanceModalCustomer.id, updated);
      setCollectSuccess(true);
      setCollectForm(defaultEmptyStock());
      setTimeout(() => setCollectSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save: ' + (err.message || err));
    }
  };

  const getEmptyStock = (c) => {
    const stock = c.emptyBottleStock || defaultEmptyStock();
    let totalWithCustomer = 0, totalCollected = 0;
    const perType = {};
    CYLINDER_TYPES.forEach(t => {
      const s = stock[t] || { withCustomer: 0, collected: 0 };
      const withC = Number(s.withCustomer) || 0;
      const coll = Number(s.collected) || 0;
      const net = Math.max(0, withC - coll);
      perType[t] = net;
      totalWithCustomer += withC;
      totalCollected += coll;
    });
    return { totalWithCustomer, totalCollected, net: totalWithCustomer - totalCollected, perType };
  };

  const getInvoiceBalance = (c) => {
    const bal = c.bottleBalance || defaultBalance(); // Uses correct invoice balance structure
    let totalFilled = 0;
    const perType = {};
    CYLINDER_TYPES.forEach(t => {
      const b = bal[t] || { filledGiven: 0, emptyCollected: 0 };
      const filled = Number(b.filledGiven) || 0;
      perType[t] = filled;
      totalFilled += filled;
    });
    return { totalFilled, perType };
  };

  const typeBadge = (type) => {
    const map = { Domestic: 'badge-info', Commercial: 'badge-warning', Hotel: 'badge-success', Industrial: 'badge-danger' };
    return <span className={`badge ${map[type] || 'badge-muted'}`}>{type}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} total customers</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => exportCustomersExcel(customers)}>📥 Export Excel</button>
          <button className="btn btn-primary" onClick={openAdd}>➕ Add Customer</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name, phone, address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Customer List ({filtered.length})</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>🟢 Filled Bottles Sold</th>
                <th>🫙 Empty Bottles to Collect</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No customers found</td></tr>
              ) : filtered.map(c => {
                const stock = getEmptyStock(c);
                const invBal = getInvoiceBalance(c);
                
                const hasBottlesToCollect = stock.net > 0;
                const breakdownTextStock = CYLINDER_TYPES
                  .filter(t => stock.perType[t] > 0)
                  .map(t => `${t}: ${stock.perType[t]}`)
                  .join(', ');
                  
                const hasFilledSold = invBal.totalFilled > 0;
                const breakdownTextFilled = CYLINDER_TYPES
                  .filter(t => invBal.perType[t] > 0)
                  .map(t => `${t}: ${invBal.perType[t]}`)
                  .join(', ');
                  
                return (
                  <tr key={c.id}>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{c.id}</td>
                    <td className="fw-600">{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{typeBadge(c.type)}</td>
                    <td>
                      {hasFilledSold ? (
                        <div>
                          <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '5px 12px' }}>
                            🟢 {invBal.totalFilled} bottles
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>
                            {breakdownTextFilled}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {hasBottlesToCollect ? (
                        <div
                          style={{ cursor: 'pointer' }}
                          onClick={() => openBalanceModal(c)}
                          title={`Click to manage — ${breakdownTextStock}`}
                        >
                          <span
                            className="badge badge-danger"
                            style={{ fontSize: '0.85rem', fontWeight: 700, padding: '5px 12px' }}
                          >
                            🫙 {stock.net} bottles
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 4, fontWeight: 600 }}>
                            {breakdownTextStock}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="badge badge-success"
                          style={{ cursor: 'pointer' }}
                          onClick={() => openBalanceModal(c)}
                          title="Click to manage bottle balance"
                        >
                          ✅ All collected
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openView(c)} title="View Ledger">👁 Details</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openBalanceModal(c)} title="Manage Bottles">🫙</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(c)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? '➕ Add Customer' : '✏️ Edit Customer'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit phone" />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
                </div>
              </div>

              <hr className="divider" />
              <div style={{ marginBottom: 12 }}>
                <span className="fw-600" style={{ fontSize: '0.9rem' }}>💰 Individual Cylinder Prices</span>
                <p className="form-hint mt-4">Set custom prices for this customer (used in invoices)</p>
              </div>
              <div className="form-grid">
                {CYLINDER_TYPES.map(type => (
                  <div className="form-group" key={type}>
                    <label className="form-label">{type} Price (₹)</label>
                    <input className="form-control" type="number" min="0" value={form.prices[type]}
                      onChange={e => updatePrice(type, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>{modal === 'add' ? 'Add Customer' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottle Balance Management Modal */}
      {balanceModalCustomer && (() => {
        const cust = balanceModalCustomer;
        const stock = cust.emptyBottleStock || defaultEmptyStock();
        const grandTotal = CYLINDER_TYPES.reduce((sum, t) => {
          const s = stock[t] || { withCustomer: 0, collected: 0 };
          return sum + Math.max(0, s.withCustomer - s.collected);
        }, 0);
        return (
        <div className="modal-overlay" onClick={() => setBalanceModalId(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🫙 Empty Bottle Stock — {cust.name}</span>
              <button className="modal-close" onClick={() => setBalanceModalId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                💡 <strong>How it works:</strong> This tracks physical empty bottles separate from invoices. <strong>"With Customer"</strong> is how many empty bottles they have. <strong>"Collected"</strong> is how many you picked up.
              </div>

              {/* Success Message */}
              {collectSuccess && (
                <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', marginBottom: 16, textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>
                  ✅ Empty bottle records updated successfully!
                </div>
              )}

              {/* Current Balance — Read Only (LIVE from customers array) */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>📊 Current Pending Balance</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => { setBalanceModalId(null); navigate(`/invoices/new?type=empty&customer=${cust.id}`); }}
                    >
                      🫙 Create Empty Bottle Invoice
                    </button>
                    <span className={`badge ${grandTotal > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.85rem', fontWeight: 700, padding: '5px 12px' }}>
                      {grandTotal > 0 ? `${grandTotal} bottles pending` : '✅ All collected'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {CYLINDER_TYPES.map(type => {
                    const s = stock[type] || { withCustomer: 0, collected: 0 };
                    const net = Math.max(0, s.withCustomer - s.collected);
                    return (
                      <div key={type} style={{
                        padding: 12, borderRadius: 8, textAlign: 'center',
                        background: net > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                        border: net > 0 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(34,197,94,0.25)',
                      }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{CYL_ICONS[type]} {type}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 2 }}>With Cust: {s.withCustomer} | Collected: {s.collected}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: net > 0 ? 'var(--danger)' : 'var(--success)' }}>
                          {net > 0 ? net : '✅ 0'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{net > 0 ? 'to collect' : 'all clear'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add to Empty Bottle Stock */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>➕ Add Empty Bottle Records</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                    Add amounts to the customer's total empty bottles, or record empty bottles you just collected. Saves to database immediately.
                  </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                  {CYLINDER_TYPES.map(type => {
                    const s = stock[type] || { withCustomer: 0, collected: 0 };
                    const net = Math.max(0, s.withCustomer - s.collected);
                    return (
                      <div key={type} style={{ padding: 12, background: 'var(--bg-body)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 12, textAlign: 'center' }}>
                          {CYL_ICONS[type]} {type} Cylinder
                        </div>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--warning)' }}>⚠️ Added to Customer</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            value={collectForm[type].withCustomer || ''}
                            onChange={e => updateCollectField(type, 'withCustomer', e.target.value)}
                            placeholder="0"
                            style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--success)' }}>📥 Empty Collected</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            value={collectForm[type].collected || ''}
                            onChange={e => updateCollectField(type, 'collected', e.target.value)}
                            placeholder="0"
                            style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: 12, fontWeight: 700, fontSize: '0.95rem' }}
                  onClick={collectEmptyBottles}
                >
                  💾 Save New Records Now
                </button>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBalanceModalId(null)}>Close</button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑 Delete Customer</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
