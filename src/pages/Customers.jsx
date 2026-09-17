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
  const { customers, addCustomer, updateCustomer, deleteCustomer, setBottleBalanceDirect, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Bottle balance modal
  const [balanceModal, setBalanceModal] = useState(null); // customer object
  const [balanceForm, setBalanceForm] = useState(defaultBalance());

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || c.address.toLowerCase().includes(search.toLowerCase());
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
    const bal = c.bottleBalance || defaultBalance();
    setBalanceForm(JSON.parse(JSON.stringify(bal)));
    setBalanceModal(c);
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

  const updateBalanceField = (cylType, field, val) => {
    setBalanceForm(prev => ({
      ...prev,
      [cylType]: {
        ...prev[cylType],
        [field]: Math.max(0, Number(val) || 0),
      }
    }));
  };

  const saveBalance = () => {
    setBottleBalanceDirect(balanceModal.id, balanceForm);
    setBalanceModal(null);
  };

  const getBalance = (c) => {
    const bal = c.bottleBalance || defaultBalance();
    let totalFilled = 0, totalEmpty = 0;
    CYLINDER_TYPES.forEach(t => {
      const b = bal[t] || { filledGiven: 0, emptyCollected: 0 };
      totalFilled += b.filledGiven;
      totalEmpty += b.emptyCollected;
    });
    return { totalFilled, totalEmpty, net: totalFilled - totalEmpty };
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
                <th>5kg Price</th>
                <th>19kg Price</th>
                <th>47.5kg Price</th>
                <th>🫙 Bottles With Customer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No customers found</td></tr>
              ) : filtered.map(c => {
                const bal = getBalance(c);
                return (
                  <tr key={c.id}>
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{c.id}</td>
                    <td className="fw-600">{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{typeBadge(c.type)}</td>
                    <td className="text-accent">₹{c.prices['5kg']}</td>
                    <td className="text-accent">₹{c.prices['19kg']}</td>
                    <td className="text-accent">₹{c.prices['47.5kg']}</td>
                    <td>
                      <span
                        className={`badge ${bal.net > 0 ? 'badge-warning' : 'badge-success'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openBalanceModal(c)}
                        title="Click to manage bottle balance"
                      >
                        🫙 {bal.net} bottles
                      </span>
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
      {balanceModal && (
        <div className="modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🫙 Bottle Balance — {balanceModal.name}</span>
              <button className="modal-close" onClick={() => setBalanceModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px', background: 'rgba(234,88,12,0.06)', borderRadius: 8, border: '1px solid rgba(234,88,12,0.15)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                💡 <strong>How it works:</strong> "Filled Given" = total filled bottles you've given to this customer over time. "Empty Collected" = total empty bottles you've collected back. The <strong>Balance</strong> shows how many of your bottles are still with the customer. This auto-updates when invoices are created, but you can also edit manually.
              </div>

              {CYLINDER_TYPES.map(type => {
                const b = balanceForm[type] || { filledGiven: 0, emptyCollected: 0 };
                const net = b.filledGiven - b.emptyCollected;
                return (
                  <div key={type} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{CYL_ICONS[type]} {type} Cylinder</span>
                      <span className={`badge ${net > 0 ? 'badge-warning' : net === 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                        Balance: {net} bottles with customer
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--success)' }}>🟢 Total Filled Given</label>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          value={b.filledGiven}
                          onChange={e => updateBalanceField(type, 'filledGiven', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: 'var(--danger)' }}>🔴 Total Empty Collected</label>
                        <input
                          className="form-control"
                          type="number"
                          min="0"
                          value={b.emptyCollected}
                          onChange={e => updateBalanceField(type, 'emptyCollected', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Grand Total */}
              <div style={{ padding: 14, background: 'rgba(234,88,12,0.06)', borderRadius: 8, border: '1px solid rgba(234,88,12,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>📊 Grand Total Bottles With Customer</span>
                  <span className="text-accent">
                    {CYLINDER_TYPES.reduce((sum, t) => {
                      const b = balanceForm[t] || { filledGiven: 0, emptyCollected: 0 };
                      return sum + (b.filledGiven - b.emptyCollected);
                    }, 0)} bottles
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBalanceModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBalance}>💾 Save Balance</button>
            </div>
          </div>
        </div>
      )}

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
