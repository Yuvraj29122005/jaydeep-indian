import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportStockExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };
const CYL_DESC = { '5kg': 'Small Domestic', '19kg': 'Standard Commercial', '47.5kg': 'Industrial/Hotel' };

export default function Stock() {
  const { stock, addStockManual, updateStock, canEditModule, agencySettings } = useApp();
  const canEdit = canEditModule('stock');
  const [activeTab, setActiveTab] = useState('overview');
  const [addModal, setAddModal] = useState(null); // cylinderType
  const [addForm, setAddForm] = useState({ filledAdd: '', emptyAdd: '' });
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ filledCount: '', emptyCount: '' });

  const openAdd = (type) => {
    setAddForm({ filledAdd: '', emptyAdd: '' });
    setAddModal(type);
  };

  const openAdjust = (s) => {
    setAdjustForm({ filledCount: s.filledCount, emptyCount: s.emptyCount });
    setAdjustModal(s.cylinderType);
  };

  const submitAdd = () => {
    if (!addForm.filledAdd && !addForm.emptyAdd) return;
    addStockManual(addModal, Number(addForm.filledAdd) || 0, Number(addForm.emptyAdd) || 0);
    setAddModal(null);
  };

  const submitAdjust = () => {
    const s = stock.find(st => st.cylinderType === adjustModal);
    const filledDelta = Number(adjustForm.filledCount) - s.filledCount;
    const emptyDelta = Number(adjustForm.emptyCount) - s.emptyCount;
    updateStock(adjustModal, filledDelta, emptyDelta);
    setAdjustModal(null);
  };

  const getStockByType = (type) => stock.find(s => s.cylinderType === type) || { filledCount: 0, emptyCount: 0 };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Management</h1>
          <p className="page-subtitle">Track filled and empty cylinder inventory</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => exportStockExcel(stock, agencySettings)}>
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-24">
        <button className={`tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button className={`tab${activeTab === 'filled' ? ' active' : ''}`} onClick={() => setActiveTab('filled')}>🟢 Filled Bottles</button>
        <button className={`tab${activeTab === 'empty' ? ' active' : ''}`} onClick={() => setActiveTab('empty')}>🔴 Empty Bottles</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {CYLINDER_TYPES.map(type => {
              const s = getStockByType(type);
              const total = s.filledCount + s.emptyCount;
              const filledPct = total > 0 ? (s.filledCount / total) * 100 : 0;
              return (
                <div className="stock-type-card" key={type}>
                  <div className="stock-type-header">
                    <div className="stock-type-icon">{CYL_ICONS[type]}</div>
                    <div>
                      <div className="stock-type-name">{type} Cylinder</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CYL_DESC[type]}</div>
                    </div>
                  </div>

                  <div className="stock-counts">
                    <div className="stock-count-box">
                      <div className="stock-count-num filled-color">{s.filledCount}</div>
                      <div className="stock-count-label">🟢 Filled</div>
                    </div>
                    <div className="stock-count-box">
                      <div className="stock-count-num empty-color">{s.emptyCount}</div>
                      <div className="stock-count-label">🔴 Empty</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Filled ratio</span>
                      <span>{filledPct.toFixed(0)}%</span>
                    </div>
                    <div className="stock-bar-track">
                      <div className="stock-bar-fill filled" style={{ width: `${filledPct}%` }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      Total: <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> cylinders
                    </div>
                  </div>

                  {canEdit && (
                    <div className="btn-group">
                      <button className="btn btn-primary btn-sm" style={{ boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)' }} onClick={() => openAdd(type)}>➕ Add Stock</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(s)}>✏️ Adjust</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <div className="card mt-24">
            <div className="card-header">
              <span className="card-title">📋 Stock Summary Table</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cylinder Type</th>
                    <th>Description</th>
                    <th>🟢 Filled</th>
                    <th>🔴 Empty</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CYLINDER_TYPES.map(type => {
                    const s = getStockByType(type);
                    const total = s.filledCount + s.emptyCount;
                    const lowStock = s.filledCount < 10;
                    return (
                      <tr key={type}>
                        <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                        <td className="text-muted">{CYL_DESC[type]}</td>
                        <td className="text-success fw-600">{s.filledCount}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{s.emptyCount}</td>
                        <td className="fw-600">{total}</td>
                        <td>
                          {lowStock
                            ? <span className="badge badge-danger">⚠ Low Stock</span>
                            : <span className="badge badge-success">✓ Adequate</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'filled' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🟢 Filled Bottle Inventory</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cylinder Type</th>
                  <th>Description</th>
                  <th>Filled Count</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {CYLINDER_TYPES.map(type => {
                  const s = getStockByType(type);
                  return (
                    <tr key={type}>
                      <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                      <td className="text-muted">{CYL_DESC[type]}</td>
                      <td className="text-success fw-600" style={{ fontSize: '1.1rem' }}>{s.filledCount}</td>
                      <td>
                        {s.filledCount === 0
                          ? <span className="badge badge-danger">Out of Stock</span>
                          : s.filledCount < 10
                          ? <span className="badge badge-warning">⚠ Low</span>
                          : <span className="badge badge-success">✓ In Stock</span>
                        }
                      </td>
                      <td>
                        {canEdit && <button className="btn btn-primary btn-sm" style={{ boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)' }} onClick={() => openAdd(type)}>➕ Add Filled</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'empty' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔴 Empty Bottle Inventory</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cylinder Type</th>
                  <th>Description</th>
                  <th>Empty Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {CYLINDER_TYPES.map(type => {
                  const s = getStockByType(type);
                  return (
                    <tr key={type}>
                      <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                      <td className="text-muted">{CYL_DESC[type]}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '1.1rem' }}>{s.emptyCount}</td>
                      <td>
                        {canEdit && <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(s)}>✏️ Update</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card-body">
            <div style={{ padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              💡 <strong>Note:</strong> Empty bottles are automatically added when you collect empties during invoice creation. You can also manually adjust stock counts.
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ Add Stock — {addModal}</span>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Filled Bottles to Add</label>
                  <input className="form-control" type="number" min="0" value={addForm.filledAdd}
                    onChange={e => setAddForm(f => ({ ...f, filledAdd: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Empty Bottles to Add</label>
                  <input className="form-control" type="number" min="0" value={addForm.emptyAdd}
                    onChange={e => setAddForm(f => ({ ...f, emptyAdd: e.target.value }))} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdd}>Add Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Adjust Stock — {adjustModal}</span>
              <button className="modal-close" onClick={() => setAdjustModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Filled Bottles (Total)</label>
                  <input className="form-control" type="number" min="0" value={adjustForm.filledCount}
                    onChange={e => setAdjustForm(f => ({ ...f, filledCount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Empty Bottles (Total)</label>
                  <input className="form-control" type="number" min="0" value={adjustForm.emptyCount}
                    onChange={e => setAdjustForm(f => ({ ...f, emptyCount: e.target.value }))} />
                </div>
              </div>
              <p className="form-hint mt-8">⚠️ This sets the total count directly.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdjust}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
