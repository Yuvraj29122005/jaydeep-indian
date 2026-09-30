import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { exportStockExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };
const CYL_DESC = {
  '5kg': 'Small Domestic / Commercial Booster (5 Kg)',
  '19kg': 'Standard Commercial Cylinders (19 Kg)',
  '47.5kg': 'Industrial / Jumbo Cylinders (47.5 Kg)',
};

export default function Stock() {
  const { 
    stock, 
    addStockManual, 
    setStockDirect, 
    refreshStock, 
    getCylinderMetrics, 
    canEditModule, 
    agencySettings 
  } = useApp();

  const canEdit = canEditModule('stock');
  const [addModal, setAddModal] = useState(null); // cylinderType
  const [addForm, setAddForm] = useState({ filledAdd: '', emptyAdd: '' });
  const [adjustModal, setAdjustModal] = useState(null); // cylinderType
  const [adjustForm, setAdjustForm] = useState({ filledCount: '', emptyCount: '' });
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  // Automatic synchronization on mount, periodic interval, and window focus
  useEffect(() => {
    let isMounted = true;
    
    const doAutoSync = async () => {
      try {
        await refreshStock(true);
        if (isMounted) {
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (err) {
        console.warn('Auto stock sync note:', err);
      }
    };

    doAutoSync();

    // Periodic auto-sync every 30 seconds
    const intervalId = setInterval(doAutoSync, 30000);

    // Auto-sync when window regains focus
    const onWindowFocus = () => {
      doAutoSync();
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  const handleFetchStock = async () => {
    setIsFetching(true);
    setSyncNotice(null);
    try {
      await refreshStock(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(timeStr);
      setSyncNotice('✓ Fresh stock fetched from database!');
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (err) {
      console.error('Manual fetch error:', err);
      setSyncNotice('⚠️ Could not connect to database, local stock used');
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setIsFetching(false);
    }
  };

  const metrics = getCylinderMetrics ? getCylinderMetrics() : {};

  // Compute aggregate totals across all varieties for the audit table
  const aggregate = {
    warehouseFilled: 0,
    warehouseEmpty: 0,
    warehouseTotal: 0,
    withCustomers: 0,
    inTransitRefill: 0,
    totalAgencyPool: 0,
  };

  CYLINDER_TYPES.forEach(type => {
    const m = metrics[type] || {
      warehouseFilled: 0,
      warehouseEmpty: 0,
      warehouseTotal: 0,
      withCustomers: 0,
      inTransitRefill: 0,
      totalAgencyPool: 0,
    };
    aggregate.warehouseFilled += m.warehouseFilled;
    aggregate.warehouseEmpty += m.warehouseEmpty;
    aggregate.warehouseTotal += m.warehouseTotal;
    aggregate.withCustomers += m.withCustomers;
    aggregate.inTransitRefill += m.inTransitRefill;
    aggregate.totalAgencyPool += m.totalAgencyPool;
  });

  const openAdd = (type) => {
    setAddForm({ filledAdd: '', emptyAdd: '' });
    setAddModal(type);
  };

  const openAdjust = (type, currentFilled, currentEmpty) => {
    setAdjustForm({ filledCount: currentFilled, emptyCount: currentEmpty });
    setAdjustModal(type);
  };

  const submitAdd = async (e) => {
    if (e) e.preventDefault();
    const fAdd = Number(addForm.filledAdd) || 0;
    const eAdd = Number(addForm.emptyAdd) || 0;
    if (fAdd === 0 && eAdd === 0) {
      setAddModal(null);
      return;
    }
    setSubmitting(true);
    try {
      await addStockManual(addModal, fAdd, eAdd);
      await refreshStock(true);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setAddModal(null);
    } catch (err) {
      console.error('Failed to add stock:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjust = async (e) => {
    if (e) e.preventDefault();
    const fCount = Number(adjustForm.filledCount) || 0;
    const eCount = Number(adjustForm.emptyCount) || 0;
    setSubmitting(true);
    try {
      await setStockDirect(adjustModal, fCount, eCount);
      await refreshStock(true);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setAdjustModal(null);
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Cylinder Stock Management</h1>
          <p className="page-subtitle">
            Live inventory of filled & empty cylinders in godown and network
          </p>
        </div>
        <div className="btn-group" style={{ alignItems: 'center' }}>
          {syncNotice && (
            <span className="badge badge-success" style={{ alignSelf: 'center', padding: '6px 12px', fontSize: '0.85rem' }}>
              {syncNotice}
            </span>
          )}

          {/* Automatic Database Sync Indicator */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: 'rgba(34, 197, 94, 0.08)', 
              color: '#15803d', 
              border: '1px solid rgba(34, 197, 94, 0.25)', 
              padding: '6px 14px', 
              borderRadius: 20, 
              fontSize: '0.82rem', 
              fontWeight: 600 
            }}
            title="Database continuously synchronizes automatically"
          >
            <span style={{ 
              display: 'inline-block', 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#16a34a',
              boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)' 
            }} />
            <span>Auto-synced</span>
            {lastSyncedTime && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                ({lastSyncedTime})
              </span>
            )}
          </div>

          {/* Fetch from DB Button */}
          <button 
            className="btn btn-secondary" 
            onClick={handleFetchStock}
            disabled={isFetching}
            title="Fetch freshest stock and counts from database right now"
          >
            {isFetching ? '⏳ Fetching...' : '🔄 Fetch from DB'}
          </button>

          {/* Export Excel Button */}
          <button 
            className="btn btn-secondary" 
            onClick={() => exportStockExcel(stock, agencySettings)}
            title="Download full inventory report in Excel format"
          >
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* Variety-Wise Cylinder Cards - Main Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28 }}>
        {CYLINDER_TYPES.map(type => {
          const m = metrics[type] || {
            warehouseFilled: 0,
            warehouseEmpty: 0,
            warehouseTotal: 0,
            withCustomers: 0,
            inTransitRefill: 0,
            totalAgencyPool: 0,
          };
          const isLowStock = m.warehouseFilled < 10;

          return (
            <div className="stock-type-card" key={type} style={{ position: 'relative', overflow: 'hidden' }}>
              {isLowStock && (
                <div style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  ⚠️ Low Stock
                </div>
              )}

              <div className="stock-type-header" style={{ marginBottom: 16 }}>
                <div className="stock-type-icon">{CYL_ICONS[type]}</div>
                <div>
                  <div className="stock-type-name" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{type} Cylinder</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{CYL_DESC[type]}</div>
                </div>
              </div>

              {/* Godown Stock Counts */}
              <div className="stock-counts" style={{ marginBottom: 16 }}>
                <div className="stock-count-box" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                  <div className="stock-count-num filled-color">{m.warehouseFilled}</div>
                  <div className="stock-count-label">🟢 Filled (Godown)</div>
                </div>
                <div className="stock-count-box" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                  <div className="stock-count-num" style={{ color: '#ef4444' }}>{m.warehouseEmpty}</div>
                  <div className="stock-count-label">🔴 Empty (Godown)</div>
                </div>
              </div>

              {/* Full Network Stats Breakdown */}
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: 8,
                padding: '12px 14px',
                border: '1px solid var(--border)',
                marginBottom: 16,
                fontSize: '0.82rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8
              }}>
                <div>
                  <span className="text-muted">🏢 Total in Godown: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{m.warehouseTotal}</strong>
                </div>
                <div>
                  <span className="text-muted">👥 With Customers: </span>
                  <strong style={{ color: '#f59e0b' }}>{m.withCustomers}</strong>
                </div>
                <div>
                  <span className="text-muted">🚚 Plant Transit: </span>
                  <strong style={{ color: 'var(--primary)' }}>{m.inTransitRefill}</strong>
                </div>
                <div>
                  <span className="text-muted">🌐 Total Pool: </span>
                  <strong style={{ color: '#8b5cf6' }}>{m.totalAgencyPool}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="btn-group" style={{ margin: 0 }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '8px 14px', fontSize: '0.88rem' }} 
                    onClick={() => openAdd(type)}
                  >
                    ➕ Add Stock
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '8px 14px', fontSize: '0.88rem' }}
                    onClick={() => openAdjust(type, m.warehouseFilled, m.warehouseEmpty)}
                  >
                    ✏️ Adjust Stock
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clean Full Inventory Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">📋 Godown & Network Inventory Overview</span>
          <span className="badge badge-success">✓ Live Database Synced</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cylinder Variety</th>
                <th>🟢 Filled (Godown)</th>
                <th>🔴 Empty (Godown)</th>
                <th>🏢 Total in Godown</th>
                <th>👥 With Customers</th>
                <th>🚚 Plant Transit</th>
                <th>🌐 Total Agency Pool</th>
                <th>Status</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {CYLINDER_TYPES.map(type => {
                const m = metrics[type] || {
                  warehouseFilled: 0,
                  warehouseEmpty: 0,
                  warehouseTotal: 0,
                  withCustomers: 0,
                  inTransitRefill: 0,
                  totalAgencyPool: 0,
                };
                const isLowStock = m.warehouseFilled < 10;
                return (
                  <tr key={type}>
                    <td className="fw-600">
                      <span style={{ fontSize: '1.15rem', marginRight: 8 }}>{CYL_ICONS[type]}</span>
                      {type} Cylinder
                    </td>
                    <td className="text-success fw-600" style={{ fontSize: '1.05rem' }}>{m.warehouseFilled}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600, fontSize: '1.05rem' }}>{m.warehouseEmpty}</td>
                    <td className="fw-600">{m.warehouseTotal}</td>
                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>{m.withCustomers}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{m.inTransitRefill}</td>
                    <td style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.05rem' }}>{m.totalAgencyPool}</td>
                    <td>
                      {isLowStock ? (
                        <span className="badge badge-danger">⚠️ Low Stock</span>
                      ) : (
                        <span className="badge badge-success">✓ Optimal</span>
                      )}
                    </td>
                    {canEdit && (
                      <td>
                        <div className="btn-group" style={{ margin: 0 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => openAdd(type)}>
                            ➕ Add
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(type, m.warehouseFilled, m.warehouseEmpty)}>
                            ✏️ Adjust
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td>TOTAL (ALL VARIETIES)</td>
                <td className="text-success" style={{ fontSize: '1.15rem' }}>{aggregate.warehouseFilled}</td>
                <td style={{ color: '#ef4444', fontSize: '1.15rem' }}>{aggregate.warehouseEmpty}</td>
                <td style={{ fontSize: '1.15rem' }}>{aggregate.warehouseTotal}</td>
                <td style={{ color: '#f59e0b', fontSize: '1.15rem' }}>{aggregate.withCustomers}</td>
                <td style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>{aggregate.inTransitRefill}</td>
                <td style={{ color: '#8b5cf6', fontSize: '1.25rem' }}>{aggregate.totalAgencyPool}</td>
                <td><span className="badge badge-primary">Total Assets</span></td>
                {canEdit && <td>—</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD STOCK */}
      {addModal && (() => {
        const currentItem = stock.find(st => st.cylinderType === addModal) || { filledCount: 0, emptyCount: 0 };
        const curF = Number(currentItem.filledCount) || 0;
        const curE = Number(currentItem.emptyCount) || 0;
        const addF = Number(addForm.filledAdd) || 0;
        const addE = Number(addForm.emptyAdd) || 0;

        return (
          <div className="modal-overlay" onClick={() => !submitting && setAddModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">➕ Add Stock — {addModal} Cylinder</span>
                <button className="modal-close" onClick={() => !submitting && setAddModal(null)}>×</button>
              </div>
              <form onSubmit={submitAdd}>
                <div className="modal-body">
                  <div style={{ background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Current Godown Count: <strong className="text-success">{curF} Filled</strong> · <strong style={{ color: '#ef4444' }}>{curE} Empty</strong>
                    </div>
                    {(addF > 0 || addE > 0) && (
                      <div style={{ marginTop: 6, fontWeight: 600, color: 'var(--primary)' }}>
                        ➡️ New Total: <span className="text-success">{curF + addF} Filled</span> · <span style={{ color: '#ef4444' }}>{curE + addE} Empty</span>
                      </div>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">🟢 Filled Cylinders to Add</label>
                      <input 
                        className="form-control" 
                        type="number" 
                        min="0" 
                        value={addForm.filledAdd}
                        onChange={e => setAddForm(f => ({ ...f, filledAdd: e.target.value }))} 
                        placeholder="0" 
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">🔴 Empty Cylinders to Add</label>
                      <input 
                        className="form-control" 
                        type="number" 
                        min="0" 
                        value={addForm.emptyAdd}
                        onChange={e => setAddForm(f => ({ ...f, emptyAdd: e.target.value }))} 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => setAddModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? '💾 Saving to DB...' : '💾 Save & Add to Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: ADJUST / SET EXACT STOCK */}
      {adjustModal && (() => {
        const currentItem = stock.find(st => st.cylinderType === adjustModal) || { filledCount: 0, emptyCount: 0 };
        const curF = Number(currentItem.filledCount) || 0;
        const curE = Number(currentItem.emptyCount) || 0;

        return (
          <div className="modal-overlay" onClick={() => !submitting && setAdjustModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">✏️ Adjust Godown Count — {adjustModal} Cylinder</span>
                <button className="modal-close" onClick={() => !submitting && setAdjustModal(null)}>×</button>
              </div>
              <form onSubmit={submitAdjust}>
                <div className="modal-body">
                  <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(234, 88, 12, 0.2)', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Current Godown Count: <strong className="text-success">{curF} Filled</strong> · <strong style={{ color: '#ef4444' }}>{curE} Empty</strong>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Directly sets the exact physical count in godown and saves to Supabase database.
                    </p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">🟢 Exact Filled Cylinders in Godown</label>
                      <input 
                        className="form-control" 
                        type="number" 
                        min="0" 
                        value={adjustForm.filledCount}
                        onChange={e => setAdjustForm(f => ({ ...f, filledCount: e.target.value }))} 
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">🔴 Exact Empty Cylinders in Godown</label>
                      <input 
                        className="form-control" 
                        type="number" 
                        min="0" 
                        value={adjustForm.emptyCount}
                        onChange={e => setAdjustForm(f => ({ ...f, emptyCount: e.target.value }))} 
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => setAdjustModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? '💾 Saving to DB...' : '💾 Save Exact Count'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
