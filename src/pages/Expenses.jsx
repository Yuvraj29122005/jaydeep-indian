import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EXPENSE_TYPES } from '../lib/constants';

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  type: 'Fuel',
  description: ''
};

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filter logic
  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || e.type === filterType;
    return matchSearch && matchType;
  });

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalFilteredAmount = sorted.reduce((sum, e) => sum + Number(e.amount), 0);

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (e) => {
    setForm({ date: e.date, amount: e.amount, type: e.type, description: e.description });
    setEditId(e.id);
    setModal('edit');
  };

  const submitForm = () => {
    if (!form.date || !form.amount || !form.description) {
      return alert('Date, Amount, and Description are required.');
    }
    
    const expenseData = {
      ...form,
      amount: Number(form.amount)
    };

    if (modal === 'add') {
      addExpense(expenseData);
    } else {
      updateExpense(editId, expenseData);
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  const typeBadge = (type) => {
    const map = {
      'Fuel': 'badge-warning',
      'Salary': 'badge-success',
      'Office Supplies': 'badge-info',
      'Utilities': 'badge-primary',
      'Maintenance': 'badge-danger',
      'Miscellaneous': 'badge-muted'
    };
    return <span className={`badge ${map[type] || 'badge-muted'}`}>{type}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track agency expenses</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={openAdd}>➕ Add Expense</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>💸</div>
          <div>
            <div className="stat-label">Total Selected Expenses</div>
            <div className="stat-value text-danger">₹{totalFilteredAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>📋</div>
          <div>
            <div className="stat-label">Expense Count</div>
            <div className="stat-value">{sorted.length} Records</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Categories</option>
          {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🧾 Expense List</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No expenses found</td></tr>
              ) : sorted.map(e => (
                <tr key={e.id}>
                  <td className="text-muted" style={{ fontSize: '0.78rem' }}>{e.id}</td>
                  <td>{e.date}</td>
                  <td>{typeBadge(e.type)}</td>
                  <td>{e.description}</td>
                  <td className="fw-600 text-danger">₹{e.amount.toLocaleString('en-IN')}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(e)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={evt => evt.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'add' ? '➕ Add Expense' : '✏️ Edit Expense'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-control" type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>{modal === 'add' ? 'Add Expense' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={evt => evt.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑 Delete Expense</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this expense (<strong>₹{deleteConfirm.amount}</strong> for <em>{deleteConfirm.description}</em>)? This action cannot be undone.</p>
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
