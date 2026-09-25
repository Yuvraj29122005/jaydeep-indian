import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportCustomersExcel } from '../utils/exportExcel';
import { CYLINDER_TYPES } from '../lib/constants';

const CUSTOMER_TYPES = ['Domestic', 'Commercial', 'Hotel', 'Industrial'];
const CYL_ICONS = { '5kg': '🟡', '19kg': '🟠', '47.5kg': '🔴' };

const defaultBalance = () => ({
  '5kg': { filledGiven: 0, emptyCollected: 0 },
  '19kg': { filledGiven: 0, emptyCollected: 0 },
  '47.5kg': { filledGiven: 0, emptyCollected: 0 },
});

export default function Customers() {
  const navigate = useNavigate();
  const {
    customers, addCustomer, updateCustomer, deleteCustomer, updateEmptyBottleStock,
    marketPrices, marketPricesMeta, updateMarketPrices, updateCustomerDiscounts,
    canEditModule, invoices
  } = useApp();
  const canEdit = canEditModule('customers');

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterBillStatus, setFilterBillStatus] = useState('All'); // 'All' | 'Pending' | 'Paid' | 'NoBills'
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form for Add/Edit customer
  const [form, setForm] = useState({
    name: '', phone: '', address: '', type: 'Domestic',
    prices: { '5kg': 450, '19kg': 950, '47.5kg': 2200 },
    discounts: { '5kg': 0, '19kg': 0, '47.5kg': 0 },
  });

  // Bottle balance modal
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

  // ==================== MARKET PRICE MODAL STATE ====================
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [marketForm, setMarketForm] = useState({ ...marketPrices });
  const [autoUpdateCustPrices, setAutoUpdateCustPrices] = useState(true);
  const [marketUpdateLoading, setMarketUpdateLoading] = useState(false);
  const [marketUpdateSuccess, setMarketUpdateSuccess] = useState('');

  // ==================== INDIVIDUAL CUSTOMER DISCOUNT MODAL STATE ====================
  const [discountModalCust, setDiscountModalCust] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    prices: {},
    discounts: {},
    discountAmounts: {},
  });
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountSuccess, setDiscountSuccess] = useState(false);

  const getCustomerBillInfo = (customerId) => {
    const custInvs = (invoices || []).filter(inv => inv.customerId === customerId);
    let totalDue = 0;
    let pendingCount = 0;
    custInvs.forEach(inv => {
      const bal = Math.max(0, (Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0));
      if (bal > 0 || inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial') {
        pendingCount++;
        totalDue += bal;
      }
    });
    return {
      totalInvoices: custInvs.length,
      pendingCount,
      totalDue,
      hasPending: pendingCount > 0,
    };
  };

  const pendingCustomersCount = customers.filter(c => getCustomerBillInfo(c.id).hasPending).length;

  const filtered = customers.filter(c => {
    const searchLower = (search || '').toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(searchLower);
    const phoneMatch = (c.phone || '').includes(searchLower);
    const addressMatch = (c.address || '').toLowerCase().includes(searchLower);
    
    const matchSearch = nameMatch || phoneMatch || addressMatch;
    const matchType = filterType === 'All' || c.type === filterType;

    const billInfo = getCustomerBillInfo(c.id);
    let matchBill = true;
    if (filterBillStatus === 'Pending') {
      matchBill = billInfo.hasPending;
    } else if (filterBillStatus === 'Paid') {
      matchBill = billInfo.totalInvoices > 0 && !billInfo.hasPending;
    } else if (filterBillStatus === 'NoBills') {
      matchBill = billInfo.totalInvoices === 0;
    }

    return matchSearch && matchType && matchBill;
  });

  // Open Add Customer Modal
  const openAdd = () => {
    setForm({
      name: '', phone: '', address: '', type: 'Domestic',
      prices: {
        '5kg': marketPrices['5kg'] || 500,
        '19kg': marketPrices['19kg'] || 1000,
        '47.5kg': marketPrices['47.5kg'] || 2300,
      },
      discounts: { '5kg': 0, '19kg': 0, '47.5kg': 0 }
    });
    setEditId(null);
    setModal('add');
  };

  // Open Edit Customer Modal
  const openEdit = (c) => {
    const custDiscounts = {};
    CYLINDER_TYPES.forEach(t => {
      if (c.discounts?.[t] !== undefined) {
        custDiscounts[t] = c.discounts[t];
      } else {
        const mkt = Number(marketPrices[t]) || 0;
        const p = c.prices?.[t] !== undefined ? Number(c.prices[t]) : mkt;
        custDiscounts[t] = mkt > 0 && p < mkt ? Number((((mkt - p) / mkt) * 100).toFixed(1)) : 0;
      }
    });

    setForm({
      name: c.name,
      phone: c.phone,
      address: c.address,
      type: c.type,
      prices: { ...c.prices },
      discounts: custDiscounts,
    });
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

  const submitForm = async () => {
    if (!form.name || !form.phone) return alert('Name and phone are required');
    try {
      if (modal === 'add') {
        await addCustomer(form);
      } else {
        await updateCustomer(editId, form);
      }
      setModal(null);
    } catch (err) {
      alert('Failed to save customer: ' + (err.message || err));
    }
  };

  const handleDelete = (id) => {
    deleteCustomer(id);
    setDeleteConfirm(null);
  };

  // ==================== MARKET PRICE UPDATE ====================
  const openMarketModal = () => {
    setMarketForm({
      '5kg': marketPrices['5kg'] || 500,
      '19kg': marketPrices['19kg'] || 1000,
      '47.5kg': marketPrices['47.5kg'] || 2300,
    });
    setAutoUpdateCustPrices(true);
    setMarketUpdateSuccess('');
    setMarketModalOpen(true);
  };

  const handleSaveMarketPrices = async () => {
    setMarketUpdateLoading(true);
    try {
      const res = await updateMarketPrices(marketForm, autoUpdateCustPrices);
      if (res.updatedCustomersCount > 0) {
        setMarketUpdateSuccess(`✅ Market prices saved! Recalculated prices for ${res.updatedCustomersCount} customers preserving their discount percentages.`);
      } else {
        setMarketUpdateSuccess('✅ Market prices saved to database!');
      }
      setTimeout(() => {
        setMarketUpdateSuccess('');
        setMarketModalOpen(false);
      }, 1600);
    } catch (err) {
      alert('Failed to update market prices: ' + (err.message || err));
    } finally {
      setMarketUpdateLoading(false);
    }
  };

  // ==================== INDIVIDUAL CUSTOMER DISCOUNT MODAL ====================
  const openDiscountModal = (c) => {
    const prices = {};
    const discounts = {};
    const amounts = {};

    CYLINDER_TYPES.forEach(t => {
      const mkt = Number(marketPrices[t]) || 0;
      const p = c.prices?.[t] !== undefined ? Number(c.prices[t]) : mkt;
      prices[t] = p;

      let pct = c.discounts?.[t];
      if (pct === undefined || pct === null) {
        pct = mkt > 0 && p < mkt ? Number((((mkt - p) / mkt) * 100).toFixed(1)) : 0;
      }
      discounts[t] = Number(pct);
      amounts[t] = Math.max(0, mkt - p);
    });

    setDiscountForm({ prices, discounts, discountAmounts: amounts });
    setDiscountSuccess(false);
    setDiscountModalCust(c);
  };

  const handleCustomerPriceChange = (type, val) => {
    const p = Math.max(0, Number(val) || 0);
    const mkt = Number(marketPrices[type]) || 0;
    const amt = mkt - p;
    const pct = mkt > 0 && amt > 0 ? Number(((amt / mkt) * 100).toFixed(1)) : 0;

    setDiscountForm(prev => ({
      ...prev,
      prices: { ...prev.prices, [type]: p },
      discounts: { ...prev.discounts, [type]: pct },
      discountAmounts: { ...prev.discountAmounts, [type]: Math.max(0, amt) },
    }));
  };

  const handleCustomerDiscountPctChange = (type, val) => {
    const pct = Math.max(0, Math.min(100, Number(val) || 0));
    const mkt = Number(marketPrices[type]) || 0;
    const p = Math.max(0, Math.round(mkt * (1 - pct / 100)));
    const amt = mkt - p;

    setDiscountForm(prev => ({
      ...prev,
      prices: { ...prev.prices, [type]: p },
      discounts: { ...prev.discounts, [type]: pct },
      discountAmounts: { ...prev.discountAmounts, [type]: Math.max(0, amt) },
    }));
  };

  const handleCustomerDiscountAmtChange = (type, val) => {
    const amt = Math.max(0, Number(val) || 0);
    const mkt = Number(marketPrices[type]) || 0;
    const p = Math.max(0, mkt - amt);
    const pct = mkt > 0 ? Number(((amt / mkt) * 100).toFixed(1)) : 0;

    setDiscountForm(prev => ({
      ...prev,
      prices: { ...prev.prices, [type]: p },
      discounts: { ...prev.discounts, [type]: pct },
      discountAmounts: { ...prev.discountAmounts, [type]: amt },
    }));
  };

  const handleSaveCustomerDiscount = async () => {
    if (!discountModalCust) return;
    setDiscountSaving(true);
    try {
      await updateCustomerDiscounts(discountModalCust.id, discountForm.discounts, discountForm.prices);
      setDiscountSuccess(true);
      setTimeout(() => {
        setDiscountSuccess(false);
        setDiscountModalCust(null);
      }, 1200);
    } catch (err) {
      alert('Failed to save discounts: ' + (err.message || err));
    } finally {
      setDiscountSaving(false);
    }
  };

  // ==================== BOTTLE STOCK ====================
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
    const bal = c.bottleBalance || defaultBalance();
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
          <p className="page-subtitle">{customers.length} total registered customers</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => exportCustomersExcel(customers)}>📥 Export Excel</button>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>➕ Add Customer</button>}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🏷️ UPPER SECTION: PERMANENT LIVE MARKET PRICE BOARD        */}
      {/* ========================================================= */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(59,130,246,0.07) 100%)',
        border: '1px solid rgba(249,115,22,0.35)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🏷️</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Permanent Market Price Board (Benchmark Rates)
              </h2>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Admin Standard</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Standard market reference prices set by admin. Customer prices are compared with these rates, and when updated, customer prices automatically adapt keeping their discount percentages.
              {marketPricesMeta?.updatedAt && (
                <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                  • Last updated: {new Date(marketPricesMeta.updatedAt).toLocaleDateString()} {new Date(marketPricesMeta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={openMarketModal}
              style={{ fontWeight: 700, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(249,115,22,0.35)' }}
            >
              ✏️ Update Market Price
            </button>
          )}
        </div>

        {/* 3 Cylinder Market Price Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {CYLINDER_TYPES.map(type => (
            <div
              key={type}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.8rem' }}>{CYL_ICONS[type]}</span>
                <div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type} Cylinder</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                    ₹{Number(marketPrices[type] || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-info" style={{ fontSize: '0.72rem', fontWeight: 700 }}>Market Rate</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrap" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name, phone, address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Customer Types</option>
          {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="form-control"
          style={{
            width: 230,
            borderColor: filterBillStatus === 'Pending' ? 'var(--danger)' : undefined,
            background: filterBillStatus === 'Pending' ? 'rgba(239, 68, 68, 0.07)' : undefined,
            fontWeight: filterBillStatus === 'Pending' ? 700 : 500
          }}
          value={filterBillStatus}
          onChange={e => setFilterBillStatus(e.target.value)}
        >
          <option value="All">All Bill Statuses</option>
          <option value="Pending">⚠️ Unpaid / Pending Bills ({pendingCustomersCount})</option>
          <option value="Paid">✅ All Bills Paid (No Due)</option>
          <option value="NoBills">⚪ No Invoices Yet</option>
        </select>
      </div>

      {/* Quick filter pills */}
      <div style={{ display: 'flex', gap: 8, marginTop: -12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Bills:</span>
        <button
          type="button"
          className={`btn btn-sm ${filterBillStatus === 'All' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.76rem', padding: '3px 10px' }}
          onClick={() => setFilterBillStatus('All')}
        >
          All Customers ({customers.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterBillStatus === 'Pending' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ fontSize: '0.76rem', padding: '3px 10px', fontWeight: pendingCustomersCount > 0 ? 700 : 400 }}
          onClick={() => setFilterBillStatus('Pending')}
        >
          ⚠️ Has Unpaid/Pending Bills ({pendingCustomersCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterBillStatus === 'Paid' ? 'btn-success' : 'btn-secondary'}`}
          style={{ fontSize: '0.76rem', padding: '3px 10px' }}
          onClick={() => setFilterBillStatus('Paid')}
        >
          ✅ All Paid (No Due)
        </button>
      </div>

      {/* Customers Table */}
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
                <th>💰 Prices & Discounts (vs Market)</th>
                <th>🟢 Filled Sold</th>
                <th>🫙 Empty Pending</th>
                <th>💳 Bill Status / Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>No customers found</td></tr>
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
                    <td className="text-muted" style={{ fontSize: '0.78rem' }}>{c.id.slice(0, 8)}</td>
                    <td className="fw-600">{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{typeBadge(c.type)}</td>

                    {/* 💰 Prices & Discount vs Market Rate */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 230 }}>
                        {CYLINDER_TYPES.map(type => {
                          const custPrice = c.prices?.[type] !== undefined ? Number(c.prices[type]) : Number(marketPrices[type] || 0);
                          const mktPrice = Number(marketPrices[type]) || 0;
                          const discountAmt = mktPrice - custPrice;
                          const discountPct = mktPrice > 0 ? ((discountAmt / mktPrice) * 100) : 0;
                          const isDiscounted = discountAmt > 0;
                          const isEqual = discountAmt === 0;

                          return (
                            <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {CYL_ICONS[type]} {type}:
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--accent)', marginLeft: 'auto', marginRight: 6 }}>
                                ₹{custPrice}
                              </span>
                              {isDiscounted ? (
                                <span
                                  className="badge badge-success"
                                  style={{ fontSize: '0.68rem', padding: '2px 6px', fontWeight: 700 }}
                                  title={`Market: ₹${mktPrice} | Discount: ₹${discountAmt} (${discountPct.toFixed(1)}% OFF)`}
                                >
                                  -{discountPct.toFixed(0)}% (₹{discountAmt} off)
                                </span>
                              ) : isEqual ? (
                                <span
                                  className="badge badge-muted"
                                  style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                                  title={`Sold at standard market rate: ₹${mktPrice}`}
                                >
                                  Market Rate
                                </span>
                              ) : (
                                <span
                                  className="badge badge-warning"
                                  style={{ fontSize: '0.68rem', padding: '2px 6px', fontWeight: 700 }}
                                  title={`Higher than market (Market: ₹${mktPrice})`}
                                >
                                  +{Math.abs(discountPct).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {canEdit && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '2px 8px', marginTop: 3, alignSelf: 'flex-start', borderRadius: 4 }}
                            onClick={() => openDiscountModal(c)}
                            title="Click to edit discounts & prices for this customer"
                          >
                            🏷️ Edit Discounts
                          </button>
                        )}
                      </div>
                    </td>

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
                          style={{ cursor: canEdit ? 'pointer' : 'default' }}
                          onClick={() => canEdit && openBalanceModal(c)}
                          title={`Bottle Balance — ${breakdownTextStock}`}
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
                          style={{ cursor: canEdit ? 'pointer' : 'default' }}
                          onClick={() => canEdit && openBalanceModal(c)}
                          title="Bottle balance"
                        >
                          ✅ All collected
                        </span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const billInfo = getCustomerBillInfo(c.id);
                        if (billInfo.hasPending) {
                          return (
                            <div>
                              <span className="badge badge-danger" style={{ fontWeight: 700, padding: '4px 9px', fontSize: '0.82rem' }}>
                                ₹{billInfo.totalDue.toLocaleString('en-IN')} Due
                              </span>
                              <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600, marginTop: 4 }}>
                                ⚠️ {billInfo.pendingCount} pending bill{billInfo.pendingCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        }
                        if (billInfo.totalInvoices > 0) {
                          return (
                            <div>
                              <span className="badge badge-success" style={{ padding: '4px 9px', fontSize: '0.75rem' }}>
                                ✅ All Paid
                              </span>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {billInfo.totalInvoices} invoice{billInfo.totalInvoices > 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <span className="badge badge-muted" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                            No Invoices
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openView(c)} title="View Ledger">👁 Details</button>
                        {canEdit && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => openBalanceModal(c)} title="Manage Bottles">🫙</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(c)}>🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🏷️ MODAL 1: MARKET PRICE UPDATE MODAL                      */}
      {/* ========================================================= */}
      {marketModalOpen && (
        <div className="modal-overlay" onClick={() => setMarketModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏷️ Update Permanent Market Prices</span>
              <button className="modal-close" onClick={() => setMarketModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
                ℹ️ <strong>Permanent Market Rate:</strong> Set the benchmark market price for each cylinder type. This is saved permanently to the database.
              </div>

              {marketUpdateSuccess && (
                <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 16, textAlign: 'center' }}>
                  {marketUpdateSuccess}
                </div>
              )}

              <div className="form-grid" style={{ marginBottom: 16 }}>
                {CYLINDER_TYPES.map(type => (
                  <div className="form-group" key={type}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {CYL_ICONS[type]} {type} Market Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={marketForm[type] || ''}
                      onChange={e => setMarketForm(prev => ({ ...prev, [type]: Math.max(0, Number(e.target.value) || 0) }))}
                      placeholder={`Current: ${marketPrices[type]}`}
                      style={{ fontSize: '1.1rem', fontWeight: 700 }}
                    />
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      Current: ₹{marketPrices[type]}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(249,115,22,0.08)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.25)', marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={autoUpdateCustPrices}
                    onChange={e => setAutoUpdateCustPrices(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Automatically recalculate all customer prices based on discount percentage
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      When enabled, each customer's saved discount percentage (e.g. 10% OFF) is maintained against the new market rate, and their new prices are automatically saved to the database.
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setMarketModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveMarketPrices} disabled={marketUpdateLoading}>
                {marketUpdateLoading ? 'Saving...' : '💾 Save Market Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏷️ MODAL 2: INDIVIDUAL CUSTOMER DISCOUNT & PRICE MODAL     */}
      {/* ========================================================= */}
      {discountModalCust && (
        <div className="modal-overlay" onClick={() => setDiscountModalCust(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏷️ Customer Pricing & Discounts — {discountModalCust.name}</span>
              <button className="modal-close" onClick={() => setDiscountModalCust(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                💡 <strong>Dynamic Sync:</strong> You can edit either the <strong>Customer Price (₹)</strong>, <strong>Discount Percentage (%)</strong>, or <strong>Discount Amount (₹)</strong>. The other two calculate automatically and save to the database!
              </div>

              {discountSuccess && (
                <div style={{ padding: 10, background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)', fontWeight: 700, fontSize: '0.88rem', marginBottom: 14, textAlign: 'center' }}>
                  ✅ Customer discounts and prices saved to database!
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {CYLINDER_TYPES.map(type => {
                  const mkt = Number(marketPrices[type]) || 0;
                  const curPrice = discountForm.prices[type] !== undefined ? discountForm.prices[type] : mkt;
                  const curDiscountPct = discountForm.discounts[type] !== undefined ? discountForm.discounts[type] : 0;
                  const curDiscountAmt = discountForm.discountAmounts[type] !== undefined ? discountForm.discountAmounts[type] : Math.max(0, mkt - curPrice);

                  return (
                    <div key={type} style={{ padding: 14, background: 'var(--bg-body)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {CYL_ICONS[type]} {type} Cylinder
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Market Price: <strong style={{ color: 'var(--accent)' }}>₹{mkt}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>💰 Customer Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={curPrice}
                            onChange={e => handleCustomerPriceChange(type, e.target.value)}
                            style={{ fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>🏷️ Discount (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="form-control"
                            value={curDiscountPct}
                            onChange={e => handleCustomerDiscountPctChange(type, e.target.value)}
                            style={{ fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>✂️ Discount Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            value={curDiscountAmt}
                            onChange={e => handleCustomerDiscountAmtChange(type, e.target.value)}
                            style={{ fontWeight: 700 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span>Savings:</span>
                        <span style={{ fontWeight: 600, color: curDiscountAmt > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {curDiscountAmt > 0 ? `Customer saves ₹${curDiscountAmt} (${curDiscountPct}%) per cylinder` : 'Standard market rate (0% discount)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDiscountModalCust(null)}>Close</button>
              <button className="btn btn-primary" onClick={handleSaveCustomerDiscount} disabled={discountSaving}>
                {discountSaving ? 'Saving...' : '💾 Save Customer Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏷️ MODAL 3: ADD / EDIT CUSTOMER MODAL                      */}
      {/* ========================================================= */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
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
                <span className="fw-600" style={{ fontSize: '0.92rem' }}>💰 Cylinder Prices & Discount Compared with Market</span>
                <p className="form-hint mt-4">Enter price, discount %, or discount amount — all synchronize automatically with permanent market prices.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CYLINDER_TYPES.map(type => {
                  const mkt = Number(marketPrices[type]) || 0;
                  const curPrice = form.prices?.[type] !== undefined ? form.prices[type] : mkt;
                  const curDiscountPct = form.discounts?.[type] !== undefined ? form.discounts[type] : (mkt > 0 && curPrice < mkt ? Number((((mkt - curPrice) / mkt) * 100).toFixed(1)) : 0);
                  const curDiscountAmt = Math.max(0, mkt - curPrice);

                  return (
                    <div key={type} style={{ padding: 12, background: 'var(--bg-body)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{CYL_ICONS[type]} {type} Cylinder</span>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>Market Rate: ₹{mkt}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Price (₹)</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            value={curPrice}
                            onChange={e => {
                              const p = Math.max(0, Number(e.target.value) || 0);
                              const amt = mkt - p;
                              const pct = mkt > 0 && amt > 0 ? Number(((amt / mkt) * 100).toFixed(1)) : 0;
                              setForm(f => ({
                                ...f,
                                prices: { ...f.prices, [type]: p },
                                discounts: { ...(f.discounts || {}), [type]: pct }
                              }));
                            }}
                            style={{ fontWeight: 600 }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Discount (%)</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={curDiscountPct}
                            onChange={e => {
                              const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                              const p = Math.max(0, Math.round(mkt * (1 - pct / 100)));
                              setForm(f => ({
                                ...f,
                                prices: { ...f.prices, [type]: p },
                                discounts: { ...(f.discounts || {}), [type]: pct }
                              }));
                            }}
                            style={{ fontWeight: 600 }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Discount (₹)</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            value={curDiscountAmt}
                            onChange={e => {
                              const amt = Math.max(0, Number(e.target.value) || 0);
                              const p = Math.max(0, mkt - amt);
                              const pct = mkt > 0 ? Number(((amt / mkt) * 100).toFixed(1)) : 0;
                              setForm(f => ({
                                ...f,
                                prices: { ...f.prices, [type]: p },
                                discounts: { ...(f.discounts || {}), [type]: pct }
                              }));
                            }}
                            style={{ fontWeight: 600 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitForm}>{modal === 'add' ? 'Add Customer' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🫙 MODAL 4: BOTTLE BALANCE MANAGEMENT MODAL               */}
      {/* ========================================================= */}
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

              {/* Current Balance */}
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
