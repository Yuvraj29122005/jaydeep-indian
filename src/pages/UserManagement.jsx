import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Main agency metrics & summaries' },
  { key: 'customers', label: 'Customers', icon: '👥', desc: 'Customer list, prices, ledger & details' },
  { key: 'invoices', label: 'Invoices & Billing', icon: '🧾', desc: 'Create refills, empty bottles, payments' },
  { key: 'stock', label: 'Stock Management', icon: '🏭', desc: 'Filled & empty cylinder inventory counts' },
  { key: 'refill', label: 'Refill Tracking', icon: '🚚', desc: 'Plant trips, vehicle & cylinder dispatches' },
  { key: 'reports', label: 'Reports & Analytics', icon: '📈', desc: 'Daily, monthly, and financial summaries' },
  { key: 'expenses', label: 'Expenses', icon: '💸', desc: 'Agency operational expenses & logs' },
  { key: 'notes', label: 'Personal Notes', icon: '📝', desc: 'Day-wise private logs & file attachments' },
];

const PRESETS = {
  visitor: {
    dashboard: 'view',
    customers: 'view',
    invoices: 'view',
    stock: 'view',
    refill: 'view',
    reports: 'view',
    expenses: 'none',
    notes: 'none',
  },
  staff: {
    dashboard: 'full',
    customers: 'edit',
    invoices: 'edit',
    stock: 'edit',
    refill: 'edit',
    reports: 'view',
    expenses: 'none',
    notes: 'view',
  },
  admin: {
    dashboard: 'full',
    customers: 'edit',
    invoices: 'edit',
    stock: 'edit',
    refill: 'edit',
    reports: 'view',
    expenses: 'edit',
    notes: 'edit',
  },
};

const emptyUserForm = {
  username: '',
  password: '',
  name: '',
  role: 'staff',
  status: 'active',
  permissions: { ...PRESETS.staff },
};

export default function UserManagement() {
  const { appUsers, createAppUser, updateAppUser, deleteAppUser, currentUser } = useApp();
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'password'
  const [form, setForm] = useState(emptyUserForm);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  // Combine Super Admin + generated users
  const superAdminEntry = {
    id: 'super-admin-01',
    username: 'admin',
    name: 'Super Admin (Permanent)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: true,
    permissions: { ...PRESETS.admin },
  };

  const allDisplayUsers = [superAdminEntry, ...appUsers.filter(u => u.username !== 'admin')];

  const filteredUsers = allDisplayUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = (u.username || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm({
      ...emptyUserForm,
      permissions: { ...PRESETS.staff },
    });
    setEditId(null);
    setModal('create');
  };

  const openEdit = (u) => {
    if (u.isSuperAdmin) return alert('Super Admin settings are permanent.');
    setForm({
      username: u.username,
      password: '',
      name: u.name,
      role: u.role,
      status: u.status,
      permissions: { ...u.permissions },
    });
    setEditId(u.id);
    setModal('edit');
  };

  const openPasswordModal = (u) => {
    if (u.isSuperAdmin) return alert('Super Admin password is managed in configuration.');
    setPasswordModalUser(u);
    setNewPassword('');
    setModal('password');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const applyPreset = (presetName) => {
    setForm(prev => ({
      ...prev,
      role: presetName,
      permissions: { ...PRESETS[presetName] },
    }));
  };

  const handlePermissionChange = (moduleKey, level) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: level,
      },
    }));
  };

  const handleSaveUser = async () => {
    if (!form.username) return alert('Username is required.');
    if (modal === 'create' && !form.password) return alert('Password is required for new accounts.');

    const cleanUsername = form.username.trim().toLowerCase();
    if (cleanUsername === 'admin' && modal === 'create') {
      return alert('Username "admin" is reserved for Super Admin.');
    }

    try {
      if (modal === 'create') {
        await createAppUser({
          username: cleanUsername,
          password: form.password,
          name: form.name || cleanUsername,
          role: form.role,
          status: form.status,
          permissions: form.permissions,
        });
        setSuccessMsg(`✅ Account "${cleanUsername}" created successfully!`);
      } else {
        await updateAppUser(editId, {
          name: form.name,
          role: form.role,
          status: form.status,
          permissions: form.permissions,
          ...(form.password ? { password: form.password } : {}),
        });
        setSuccessMsg(`✅ Account "${form.name}" updated successfully!`);
      }

      setModal(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error saving user: ' + (err.message || err));
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      return alert('Password must be at least 4 characters long.');
    }
    try {
      await updateAppUser(passwordModalUser.id, { password: newPassword });
      setSuccessMsg(`✅ Password updated for "${passwordModalUser.username}"!`);
      setModal(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update password: ' + (err.message || err));
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.isSuperAdmin) return;
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAppUser(u.id, { status: nextStatus });
    } catch (err) {
      alert('Failed to update status: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAppUser(id);
      setDeleteConfirm(null);
      setSuccessMsg('✅ User account removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete user: ' + (err.message || err));
    }
  };

  const roleBadge = (role) => {
    if (role === 'admin') return <span className="badge badge-danger">👑 Admin</span>;
    if (role === 'visitor') return <span className="badge badge-info">👁️ Visitor</span>;
    return <span className="badge badge-primary">👷 Staff</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Account Generation & Permissions</h1>
          <p className="page-subtitle">
            Admin panel to generate accounts with custom passwords and granular module visibility & editing access
          </p>
        </div>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={openCreate} style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            ➕ Generate New User
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: 14, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: 'var(--success)', fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
          {successMsg}
        </div>
      )}

      {/* Summary Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--accent)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Accounts</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 6 }}>{allDisplayUsers.length}</div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Logins</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: 6 }}>
            {allDisplayUsers.filter(u => u.status === 'active').length}
          </div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Staff Members</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--info)', marginTop: 6 }}>
            {allDisplayUsers.filter(u => u.role === 'staff').length}
          </div>
        </div>
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Visitors / View-Only</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: 6 }}>
            {allDisplayUsers.filter(u => u.role === 'visitor').length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by username or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="visitor">Visitor</option>
        </select>
      </div>

      {/* User Accounts Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Authorized Accounts List ({filteredUsers.length})</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Module Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const perms = u.permissions || {};
                const visibleCount = MODULES.filter(m => perms[m.key] && perms[m.key] !== 'none').length;
                const editCount = MODULES.filter(m => perms[m.key] === 'edit' || perms[m.key] === 'full').length;

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: u.isSuperAdmin ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 800, fontSize: '0.95rem'
                        }}>
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Username: <strong style={{ color: 'var(--accent)' }}>{u.username}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{roleBadge(u.role)}</td>

                    <td>
                      {u.isSuperAdmin ? (
                        <span className="badge badge-success">Permanent</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle status"
                        >
                          {u.status === 'active' ? '● Active' : '○ Inactive'}
                        </button>
                      )}
                    </td>

                    {/* Permissions summary */}
                    <td>
                      {u.isSuperAdmin || u.role === 'admin' ? (
                        <span className="badge badge-primary" style={{ padding: '4px 10px', fontWeight: 700 }}>
                          👑 Full Unrestricted Access
                        </span>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            {MODULES.map(m => {
                              const lvl = perms[m.key] || 'none';
                              if (lvl === 'none') return null;
                              return (
                                <span
                                  key={m.key}
                                  className={`badge ${lvl === 'edit' || lvl === 'full' ? 'badge-info' : 'badge-muted'}`}
                                  style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                                  title={`${m.label}: ${lvl === 'edit' || lvl === 'full' ? 'Can Edit & Add' : 'View Only'}`}
                                >
                                  {m.icon} {m.label} ({lvl === 'edit' || lvl === 'full' ? 'Edit' : 'View'})
                                </span>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {visibleCount} visible modules • {editCount} can edit
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      {u.isSuperAdmin ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Root Account</span>
                      ) : (
                        <div className="btn-group">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} title="Edit Permissions">
                            ✏️ Permissions
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openPasswordModal(u)} title="Change Password">
                            🔑 Password
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(u)} title="Delete Account">
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ➕ MODAL: GENERATE OR EDIT USER ACCOUNT                    */}
      {/* ========================================================= */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {modal === 'create' ? '➕ Generate New User Account' : `✏️ Edit User — ${form.name}`}
              </span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Presets bar */}
              <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8 }}>
                  ⚡ Quick Role Presets: Click to auto-configure permissions
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: form.role === 'visitor' ? 'var(--info)' : 'var(--bg-primary)', color: form.role === 'visitor' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}
                    onClick={() => applyPreset('visitor')}
                  >
                    👁️ Visitor Preset (View Only Reports & Customers)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: form.role === 'staff' ? 'var(--accent)' : 'var(--bg-primary)', color: form.role === 'staff' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}
                    onClick={() => applyPreset('staff')}
                  >
                    👷 Staff Preset (Full Billing, Stock & Customer Edit)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: form.role === 'admin' ? '#ef4444' : 'var(--bg-primary)', color: form.role === 'admin' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border)' }}
                    onClick={() => applyPreset('admin')}
                  >
                    👑 Admin Preset (All Modules Full Access)
                  </button>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Username / Login ID *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. jigar_staff or visitor1"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    disabled={modal === 'edit'}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Used by the user on the Login page</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name / Display Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Jigar Patel"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                {modal === 'create' && (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Password *</label>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, password: generateRandomPassword() }))}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        🎲 Auto-Generate
                      </button>
                    </div>
                    <input
                      className="form-control"
                      placeholder="Set strong password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      style={{ marginTop: 4 }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Blocked)</option>
                  </select>
                </div>
              </div>

              <hr className="divider" />

              {/* Module-wise Permission Selector */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  🔒 Module-wise Access & Visibility Selection
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Specify for each module whether this user cannot see it (Hidden), can only view it (View Only), or can add & edit data (Full Access).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 12 }}>
                {MODULES.map(m => {
                  const currentLevel = form.permissions?.[m.key] || 'none';
                  return (
                    <div
                      key={m.key}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-body)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{m.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '6px 4px',
                            background: currentLevel === 'none' ? 'rgba(239,68,68,0.18)' : 'var(--bg-primary)',
                            color: currentLevel === 'none' ? 'var(--danger)' : 'var(--text-muted)',
                            border: currentLevel === 'none' ? '1px solid var(--danger)' : '1px solid var(--border)',
                            fontWeight: currentLevel === 'none' ? 700 : 400,
                          }}
                          onClick={() => handlePermissionChange(m.key, 'none')}
                        >
                          🚫 Hidden
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '6px 4px',
                            background: currentLevel === 'view' ? 'rgba(59,130,246,0.18)' : 'var(--bg-primary)',
                            color: currentLevel === 'view' ? 'var(--info)' : 'var(--text-muted)',
                            border: currentLevel === 'view' ? '1px solid var(--info)' : '1px solid var(--border)',
                            fontWeight: currentLevel === 'view' ? 700 : 400,
                          }}
                          onClick={() => handlePermissionChange(m.key, 'view')}
                        >
                          👁️ View Only
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '6px 4px',
                            background: currentLevel === 'edit' || currentLevel === 'full' ? 'rgba(34,197,94,0.18)' : 'var(--bg-primary)',
                            color: currentLevel === 'edit' || currentLevel === 'full' ? 'var(--success)' : 'var(--text-muted)',
                            border: currentLevel === 'edit' || currentLevel === 'full' ? '1px solid var(--success)' : '1px solid var(--border)',
                            fontWeight: currentLevel === 'edit' || currentLevel === 'full' ? 700 : 400,
                          }}
                          onClick={() => handlePermissionChange(m.key, 'edit')}
                        >
                          ✏️ Full Access
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveUser}>
                {modal === 'create' ? '💾 Generate User Account' : '💾 Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔑 MODAL: CHANGE USER PASSWORD                            */}
      {/* ========================================================= */}
      {modal === 'password' && passwordModalUser && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔑 Change Password — {passwordModalUser.name}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>New Password *</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    🎲 Auto-Generate
                  </button>
                </div>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSavePassword}>Save New Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑 Delete Account</span>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete user account <strong>{deleteConfirm.name} ({deleteConfirm.username})</strong>?</p>
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
