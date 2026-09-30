import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { exportStockExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };
const CYL_DESC = {
  '5kg': 'Small Domestic / Commercial Booster (5 Kg)',
  '19kg': 'Standard Commercial Cylinders (19 Kg)',
  '47.5kg': 'Industrial / Jumbo Hotel Cylinders (47.5 Kg)',
};

export default function Stock() {
  const { 
    stock, 
    addStockManual, 
    setStockDirect, 
    refreshStock, 
    getCylinderMetrics, 
    canEditModule, 
    agencySettings,
    customers,
    refillTrips 
  } = useApp();

  const canEdit = canEditModule('stock');
  const [activeTab, setActiveTab] = useState('overview');
  const [addModal, setAddModal] = useState(null); // cylinderType
  const [addForm, setAddForm] = useState({ filledAdd: '', emptyAdd: '' });
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ filledCount: '', emptyCount: '' });
  const [batchModal, setBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({});
  const [syncFeedback, setSyncFeedback] = useState(false);

  // Sync fresh stock data on mount
  useEffect(() => {
    refreshStock().catch(err => console.warn('Mount stock sync note:', err));
  }, []);

  const metrics = getCylinderMetrics ? getCylinderMetrics() : {};

  // Compute aggregate totals across all varieties
  const aggregate = {
    warehouseFilled: 0,
    warehouseEmpty: 0,
    warehouseTotal: 0,
    withCustomers: 0,
    inTransitRefill: 0,
    totalAgencyPool: 0,
    totalDelivered: 0,
  };

  CYLINDER_TYPES.forEach(type => {
    const m = metrics[type] || {
      warehouseFilled: 0,
      warehouseEmpty: 0,
      warehouseTotal: 0,
      withCustomers: 0,
      inTransitRefill: 0,
      totalAgencyPool: 0,
      totalDelivered: 0,
    };
    aggregate.warehouseFilled += m.warehouseFilled;
    aggregate.warehouseEmpty += m.warehouseEmpty;
    aggregate.warehouseTotal += m.warehouseTotal;
    aggregate.withCustomers += m.withCustomers;
    aggregate.inTransitRefill += m.inTransitRefill;
    aggregate.totalAgencyPool += m.totalAgencyPool;
    aggregate.totalDelivered += m.totalDelivered;
  });

  const handleManualSync = async () => {
    await refreshStock();
    setSyncFeedback(true);
    setTimeout(() => setSyncFeedback(false), 2500);
  };

  const openAdd = (type) => {
    setAddForm({ filledAdd: '', emptyAdd: '' });
    setAddModal(type);
  };

  const openAdjust = (type, currentFilled, currentEmpty) => {
    setAdjustForm({ filledCount: currentFilled, emptyCount: currentEmpty });
    setAdjustModal(type);
  };

  const openBatchModal = () => {
    const initial = {};
    CYLINDER_TYPES.forEach(type => {
      const s = stock.find(st => st.cylinderType === type) || { filledCount: 0, emptyCount: 0 };
      initial[type] = {
        filled: s.filledCount,
        empty: s.emptyCount,
      };
    });
    setBatchForm(initial);
    setBatchModal(true);
  };

  const submitAdd = async () => {
    const fAdd = Number(addForm.filledAdd) || 0;
    const eAdd = Number(addForm.emptyAdd) || 0;
    if (fAdd === 0 && eAdd === 0) return;
    await addStockManual(addModal, fAdd, eAdd);
    setAddModal(null);
  };

  const submitAdjust = async () => {
    const fCount = Number(adjustForm.filledCount) || 0;
    const eCount = Number(adjustForm.emptyCount) || 0;
    await setStockDirect(adjustModal, fCount, eCount);
    setAdjustModal(null);
  };

  const submitBatchForm = async () => {
    for (const type of CYLINDER_TYPES) {
      if (batchForm[type]) {
        const fCount = Number(batchForm[type].filled) || 0;
        const eCount = Number(batchForm[type].empty) || 0;
        await setStockDirect(type, fCount, eCount);
      }
    }
    setBatchModal(false);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cylinder Stock Management</h1>
          <p className="page-subtitle">
            Accurate, real-time inventory tracking synchronized with Supabase database (5kg, 19kg, 47.5kg)
          </p>
        </div>
        <div className="btn-group">
          {syncFeedback && (
            <span className="badge badge-success" style={{ alignSelf: 'center', padding: '6px 12px', fontSize: '0.85rem' }}>
              ✓ Synced with Database!
            </span>
          )}
          <button className="btn btn-secondary" onClick={handleManualSync} title="Fetch freshest stock count from database">
            🔄 Sync with DB
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={openBatchModal} title="Reconcile and set inventory counts for all varieties">
              ⚡ Multi-Variety Direct Audit
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => exportStockExcel(stock, agencySettings)}>
            📥 Export Excel
          </button>
        </div>
      </div>

      {/* Interconnected Top Summary Cards */}
      <div className="stats-grid mb-24" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)' }}>🟢</div>
          <div className="stat-body">
            <span className="stat-label">Godown Filled Stock</span>
            <div className="stat-val text-success">{aggregate.warehouseFilled}</div>
            <span className="stat-hint">Ready for immediate sale</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>🔴</div>
          <div className="stat-body">
            <span className="stat-label">Godown Empty Stock</span>
            <div className="stat-val" style={{ color: '#ef4444' }}>{aggregate.warehouseEmpty}</div>
            <span className="stat-hint">In warehouse ready for refill</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>🚚</div>
          <div className="stat-body">
            <span className="stat-label">Plant Refill In Transit</span>
            <div className="stat-val text-accent">{aggregate.inTransitRefill}</div>
            <span className="stat-hint">Sent on trucks to bottling plant</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>👥</div>
          <div className="stat-body">
            <span className="stat-label">With Customers</span>
            <div className="stat-val" style={{ color: '#f59e0b' }}>{aggregate.withCustomers}</div>
            <span className="stat-hint">Pending empty return collection</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>🌐</div>
          <div className="stat-body">
            <span className="stat-label">Total Agency Asset Pool</span>
            <div className="stat-val" style={{ color: '#8b5cf6' }}>{aggregate.totalAgencyPool}</div>
            <span className="stat-hint">Warehouse + Plant + Customers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-24">
        <button className={`tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Variety-Wise Comprehensive Pool
        </button>
        <button className={`tab${activeTab === 'filled' ? ' active' : ''}`} onClick={() => setActiveTab('filled')}>
          🟢 Warehouse Filled Stock
        </button>
        <button className={`tab${activeTab === 'empty' ? ' active' : ''}`} onClick={() => setActiveTab('empty')}>
          🔴 Warehouse Empty Stock
        </button>
        <button className={`tab${activeTab === 'market' ? ' active' : ''}`} onClick={() => setActiveTab('market')}>
          👥 Customer Holdings & Transit
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {CYLINDER_TYPES.map(type => {
              const m = metrics[type] || {
                warehouseFilled: 0,
                warehouseEmpty: 0,
                warehouseTotal: 0,
                withCustomers: 0,
                inTransitRefill: 0,
                totalAgencyPool: 0,
                totalDelivered: 0,
              };

              const pool = m.totalAgencyPool || (m.warehouseTotal + m.withCustomers + m.inTransitRefill) || 1;
              const filledRatio = ((m.warehouseFilled / pool) * 100).toFixed(1);
              const emptyRatio = ((m.warehouseEmpty / pool) * 100).toFixed(1);
              const transitRatio = ((m.inTransitRefill / pool) * 100).toFixed(1);
              const custRatio = ((m.withCustomers / pool) * 100).toFixed(1);

              const isLowStock = m.warehouseFilled < 10;

              return (
                <div className="stock-type-card" key={type} style={{ position: 'relative', overflow: 'hidden' }}>
                  {isLowStock && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--danger)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      ⚠️ Low Warehouse Stock
                    </div>
                  )}

                  <div className="stock-type-header">
                    <div className="stock-type-icon">{CYL_ICONS[type]}</div>
                    <div>
                      <div className="stock-type-name">{type} Cylinder</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CYL_DESC[type]}</div>
                    </div>
                  </div>

                  {/* Primary Godown Counts */}
                  <div className="stock-counts">
                    <div className="stock-count-box" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                      <div className="stock-count-num filled-color">{m.warehouseFilled}</div>
                      <div className="stock-count-label">🟢 Godown Filled</div>
                    </div>
                    <div className="stock-count-box" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                      <div className="stock-count-num" style={{ color: '#ef4444' }}>{m.warehouseEmpty}</div>
                      <div className="stock-count-label">🔴 Godown Empty</div>
                    </div>
                  </div>

                  {/* Interconnected Network Status */}
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    margin: '12px 0',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-muted">🚚 Plant Refill Transit:</span>
                      <strong style={{ color: 'var(--primary)' }}>{m.inTransitRefill} cyl</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-muted">👥 Pending With Customers:</span>
                      <strong style={{ color: '#f59e0b' }}>{m.withCustomers} cyl</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                      <span style={{ fontWeight: 600 }}>🌐 Total Agency Asset Pool:</span>
                      <strong style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>{m.totalAgencyPool} cyl</strong>
                    </div>
                  </div>

                  {/* Distribution Ratio Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Distribution Breakdown</span>
                      <span>{filledRatio}% Filled · {emptyRatio}% Empty</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${filledRatio}%`, background: 'var(--success)' }} title={`Warehouse Filled: ${m.warehouseFilled}`} />
                      <div style={{ width: `${emptyRatio}%`, background: '#ef4444' }} title={`Warehouse Empty: ${m.warehouseEmpty}`} />
                      <div style={{ width: `${transitRatio}%`, background: 'var(--primary)' }} title={`Plant Transit: ${m.inTransitRefill}`} />
                      <div style={{ width: `${custRatio}%`, background: '#f59e0b' }} title={`With Customers: ${m.withCustomers}`} />
                    </div>
                  </div>

                  {canEdit && (
                    <div className="btn-group mt-16">
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ flex: 1, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)' }} 
                        onClick={() => openAdd(type)}
                      >
                        ➕ Add Stock
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ flex: 1 }}
                        onClick={() => openAdjust(type, m.warehouseFilled, m.warehouseEmpty)}
                      >
                        ✏️ Direct Set
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Full Audit Table */}
          <div className="card mt-24">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">📋 Interconnected Cylinder Asset Audit Table</span>
              <span className="badge badge-info">Live Supabase Sync</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cylinder Variety</th>
                    <th>🟢 Warehouse Filled</th>
                    <th>🔴 Warehouse Empty</th>
                    <th>🏢 Total Warehouse</th>
                    <th>🚚 Refill Plant Transit</th>
                    <th>👥 With Customers</th>
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
                          <span style={{ fontSize: '1.1rem', marginRight: 6 }}>{CYL_ICONS[type]}</span>
                          {type}
                        </td>
                        <td className="text-success fw-600" style={{ fontSize: '1.05rem' }}>{m.warehouseFilled}</td>
                        <td style={{ color: '#ef4444', fontWeight: 600, fontSize: '1.05rem' }}>{m.warehouseEmpty}</td>
                        <td className="fw-600">{m.warehouseTotal}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{m.inTransitRefill}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{m.withCustomers}</td>
                        <td style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '1.05rem' }}>{m.totalAgencyPool}</td>
                        <td>
                          {isLowStock ? (
                            <span className="badge badge-danger">⚠️ Low Filled Stock</span>
                          ) : (
                            <span className="badge badge-success">✓ Stock Optimal</span>
                          )}
                        </td>
                        {canEdit && (
                          <td>
                            <div className="btn-group" style={{ margin: 0 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(type, m.warehouseFilled, m.warehouseEmpty)}>
                                ✏️ Set
                              </button>
                              <button className="btn btn-primary btn-sm" onClick={() => openAdd(type)}>
                                ➕ Add
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
                    <td style={{ color: 'var(--primary)', fontSize: '1.15rem' }}>{aggregate.inTransitRefill}</td>
                    <td style={{ color: '#f59e0b', fontSize: '1.15rem' }}>{aggregate.withCustomers}</td>
                    <td style={{ color: '#8b5cf6', fontSize: '1.25rem' }}>{aggregate.totalAgencyPool}</td>
                    <td><span className="badge badge-primary">Total Agency Assets</span></td>
                    {canEdit && <td>—</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: FILLED BOTTLES */}
      {activeTab === 'filled' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🟢 Godown Filled Bottle Inventory</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cylinder Variety</th>
                  <th>Description</th>
                  <th>Filled Ready Count</th>
                  <th>Holding Status</th>
                  {canEdit && <th>Quick Action</th>}
                </tr>
              </thead>
              <tbody>
                {CYLINDER_TYPES.map(type => {
                  const m = metrics[type] || { warehouseFilled: 0, warehouseEmpty: 0 };
                  return (
                    <tr key={type}>
                      <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                      <td className="text-muted">{CYL_DESC[type]}</td>
                      <td className="text-success fw-600" style={{ fontSize: '1.25rem' }}>{m.warehouseFilled} Bottles</td>
                      <td>
                        {m.warehouseFilled === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : m.warehouseFilled < 10 ? (
                          <span className="badge badge-warning">⚠️ Low Stock ({m.warehouseFilled})</span>
                        ) : (
                          <span className="badge badge-success">✓ Ready for Supply</span>
                        )}
                      </td>
                      {canEdit && (
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => openAdd(type)}>
                            ➕ Add Filled
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMPTY BOTTLES */}
      {activeTab === 'empty' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔴 Godown Empty Bottle Inventory</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cylinder Variety</th>
                  <th>Description</th>
                  <th>Empty Count in Godown</th>
                  <th>Refill Readiness</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {CYLINDER_TYPES.map(type => {
                  const m = metrics[type] || { warehouseEmpty: 0, warehouseFilled: 0 };
                  const canSendTrip = m.warehouseEmpty >= 10;
                  return (
                    <tr key={type}>
                      <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                      <td className="text-muted">{CYL_DESC[type]}</td>
                      <td style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem' }}>{m.warehouseEmpty} Bottles</td>
                      <td>
                        {canSendTrip ? (
                          <span className="badge badge-primary">🚚 Truck Batch Ready ({m.warehouseEmpty})</span>
                        ) : (
                          <span className="badge badge-muted">Accumulating</span>
                        )}
                      </td>
                      {canEdit && (
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(type, m.warehouseFilled, m.warehouseEmpty)}>
                            ✏️ Adjust Empty
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card-body">
            <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              💡 <strong>Instant Automatic Reconcile:</strong> Whenever you generate an invoice with empty bottle returns (or an Empty Bottle voucher), the godown empty stock is automatically credited immediately. When you dispatch a refill truck in Refill Tracking, empty stock is automatically deducted!
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER HOLDINGS & TRANSIT */}
      {activeTab === 'market' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">👥 Cylinders in Customer Possession & Plant Transit</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cylinder Variety</th>
                  <th>With Customers (Pending Empty)</th>
                  <th>In Transit at Bottling Plant</th>
                  <th>Lifetime Delivered to Date</th>
                  <th>Total Agency Pool</th>
                </tr>
              </thead>
              <tbody>
                {CYLINDER_TYPES.map(type => {
                  const m = metrics[type] || { withCustomers: 0, inTransitRefill: 0, totalDelivered: 0, totalAgencyPool: 0 };
                  return (
                    <tr key={type}>
                      <td className="fw-600">{CYL_ICONS[type]} {type}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.15rem' }}>{m.withCustomers} Cylinders</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.15rem' }}>{m.inTransitRefill} Cylinders</td>
                      <td className="text-muted fw-600">{m.totalDelivered} Cylinders</td>
                      <td style={{ color: '#8b5cf6', fontWeight: 800, fontSize: '1.2rem' }}>{m.totalAgencyPool} Cylinders</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              📌 <strong>Interconnected Formula:</strong> Total Agency Asset Pool = [Godown Filled] + [Godown Empty] + [Plant Refill Transit] + [Pending Customer Holdings]. Every single cylinder is tracked across all four physical locations.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STOCK */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">➕ Add Stock — {addModal}</span>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Enter the number of cylinders received into the warehouse. This increments the current database count.
              </p>
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
              <button className="btn btn-secondary" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdd}>💾 Add to Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST / SET STOCK DIRECT */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✏️ Set Godown Inventory — {adjustModal}</span>
              <button className="modal-close" onClick={() => setAdjustModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(234, 88, 12, 0.08)', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid rgba(234, 88, 12, 0.2)' }}>
                <strong style={{ color: 'var(--primary)' }}>⚠️ Direct Inventory Override:</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  This will immediately set the absolute warehouse counts for <strong>{adjustModal}</strong> in the Supabase database.
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
              <button className="btn btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdjust}>💾 Set Exact Count</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH RECONCILIATION AUDIT (ALL VARIETIES) */}
      {batchModal && (
        <div className="modal-overlay" onClick={() => setBatchModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚡ Multi-Variety Inventory Audit (5kg, 19kg, 47.5kg)</span>
              <button className="modal-close" onClick={() => setBatchModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Audit and synchronize all cylinder variety stock counts in one operation. Enter the exact physical counts present in the godown.
              </p>

              {CYLINDER_TYPES.map(type => (
                <div key={type} style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  marginBottom: 12
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{CYL_ICONS[type]}</span>
                    <span>{type} Cylinder</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>🟢 Filled Count</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        min="0"
                        value={batchForm[type]?.filled ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          setBatchForm(prev => ({
                            ...prev,
                            [type]: { ...prev[type], filled: val }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>🔴 Empty Count</label>
                      <input 
                        type="number" 
                        className="form-control form-control-sm"
                        min="0"
                        value={batchForm[type]?.empty ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          setBatchForm(prev => ({
                            ...prev,
                            [type]: { ...prev[type], empty: val }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBatchModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitBatchForm}>💾 Save All to Database</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
