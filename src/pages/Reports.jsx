import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { exportAllInvoicesExcel, exportStockExcel, exportCustomersExcel, exportDailyReportExcel, exportMonthlyReportExcel } from '../utils/exportExcel';
import { exportAllInvoicesPDF } from '../utils/exportPdf';

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#a78bfa'];

export default function Reports() {
  const { invoices, customers, stock, loading, agencySettings, marketPrices } = useApp();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const filtered = useMemo(() => invoices.filter(inv => {
    return (!dateFrom || inv.date >= dateFrom) && (!dateTo || inv.date <= dateTo);
  }), [invoices, dateFrom, dateTo]);

  const totalRevenue = filtered.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalCollected = filtered.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalOutstanding = totalRevenue - totalCollected;
  const totalCylinders = filtered.reduce((s, i) => s + (i.items || []).reduce((ss, item) => ss + (Number(item.qty) || 0), 0), 0);

  // Customer-wise data
  const customerRevMap = {};
  filtered.forEach(inv => {
    const custName = inv.customerName || 'Unknown';
    if (!customerRevMap[custName]) customerRevMap[custName] = { name: custName, revenue: 0, orders: 0 };
    customerRevMap[custName].revenue += (Number(inv.totalAmount) || 0);
    customerRevMap[custName].orders += 1;
  });
  const topCustomers = Object.values(customerRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Cylinder-wise data
  const cylRevMap = { '5kg': 0, '19kg': 0, '47.5kg': 0 };
  filtered.forEach(inv => {
    (inv.items || []).forEach(item => {
      if (cylRevMap[item.cylinderType] !== undefined) {
        cylRevMap[item.cylinderType] += ((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
      }
    });
  });
  const cylData = Object.entries(cylRevMap).map(([name, value]) => ({ name, value }));

  // Payment mode breakdown
  const payModeMap = {};
  filtered.forEach(inv => {
    const mode = inv.paymentMode || 'Cash';
    payModeMap[mode] = (payModeMap[mode] || 0) + (Number(inv.paidAmount) || 0);
  });
  const payModeData = Object.entries(payModeMap).map(([name, value]) => ({ name, value }));

  // Daily revenue
  const dailyMap = {};
  filtered.forEach(inv => {
    const dStr = inv.date || 'Unknown';
    if (!dailyMap[dStr]) dailyMap[dStr] = { date: dStr, revenue: 0, collected: 0, totalInvoices: 0, outstanding: 0 };
    const tot = Number(inv.totalAmount) || 0;
    const paid = Number(inv.paidAmount) || 0;
    dailyMap[dStr].revenue += tot;
    dailyMap[dStr].collected += paid;
    dailyMap[dStr].totalInvoices += 1;
    dailyMap[dStr].outstanding += (tot - paid);
  });
  const dailyData = Object.values(dailyMap).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // Monthly revenue (computed from real invoices)
  const monthlyMap = {};
  filtered.forEach(inv => {
    const month = (inv.date || '').slice(0, 7) || 'Unknown'; // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, collected: 0, totalInvoices: 0, outstanding: 0 };
    const tot = Number(inv.totalAmount) || 0;
    const paid = Number(inv.paidAmount) || 0;
    monthlyMap[month].revenue += tot;
    monthlyMap[month].collected += paid;
    monthlyMap[month].totalInvoices += 1;
    monthlyMap[month].outstanding += (tot - paid);
  });
  const monthlyDataReport = Object.values(monthlyMap).sort((a, b) => (a.month || '').localeCompare(b.month || ''));

  // Monthly sales data for chart (computed from real invoices)
  const monthlySalesData = useMemo(() => {
    const mMap = {};
    invoices.forEach(inv => {
      const d = inv.date ? new Date(inv.date) : new Date();
      const month = isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString('en-US', { month: 'short' });
      if (!mMap[month]) mMap[month] = { month, '5kg': 0, '19kg': 0, '47.5kg': 0, revenue: 0 };
      mMap[month].revenue += (Number(inv.totalAmount) || 0);
      (inv.items || []).forEach(item => {
        if (mMap[month][item.cylinderType] !== undefined) {
          mMap[month][item.cylinderType] += (Number(item.qty) || 0);
        }
      });
    });
    return Object.values(mMap);
  }, [invoices]);

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Reports...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Reports & Analytics</h1>
          <p className="page-subtitle">Business insights and data export</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => exportAllInvoicesExcel(filtered, agencySettings, stock)}>📥 Invoices Excel</button>
          <button className="btn btn-secondary" onClick={() => exportAllInvoicesPDF(filtered, agencySettings)}>📄 Invoices PDF</button>
          <button className="btn btn-secondary" onClick={() => exportCustomersExcel(customers, marketPrices, agencySettings)}>👥 Customers Excel</button>
          <button className="btn btn-secondary" onClick={() => exportStockExcel(stock, agencySettings)}>📦 Stock Excel</button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-24">
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="fw-600" style={{ fontSize: '0.9rem' }}>📅 Date Range:</span>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ whiteSpace: 'nowrap' }}>From</label>
            <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ whiteSpace: 'nowrap' }}>To</label>
            <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <span className="badge badge-info">{filtered.length} invoices in range</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid mb-24">
        <div className="stat-card" style={{ '--card-accent': '#22c55e' }}>
          <span className="stat-card-icon">💰</span>
          <span className="stat-card-label">Total Revenue</span>
          <span className="stat-card-value" style={{ fontSize: '1.3rem' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
          <span className="stat-card-sub">{filtered.length} invoices</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#3b82f6' }}>
          <span className="stat-card-icon">✅</span>
          <span className="stat-card-label">Collected</span>
          <span className="stat-card-value" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>₹{totalCollected.toLocaleString('en-IN')}</span>
          <span className="stat-card-sub">{totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : 0}% collected</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
          <span className="stat-card-icon">⚠️</span>
          <span className="stat-card-label">Outstanding</span>
          <span className="stat-card-value" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>₹{totalOutstanding.toLocaleString('en-IN')}</span>
          <span className="stat-card-sub">Pending collection</span>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <span className="stat-card-icon">📦</span>
          <span className="stat-card-label">Cylinders Sold</span>
          <span className="stat-card-value">{totalCylinders}</span>
          <span className="stat-card-sub">Total units</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="chart-grid">
        {/* Monthly Sales */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">📊 Monthly Sales Volume</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="5kg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="19kg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="47.5kg" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-title">📈 Daily Revenue (Selected Period)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="chart-card">
          <div className="chart-title">🏆 Top Customers by Revenue</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {topCustomers.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Cylinder */}
        <div className="chart-card">
          <div className="chart-title">🥧 Revenue by Cylinder Type</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={cylData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                {cylData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Mode Breakdown */}
        <div className="chart-card">
          <div className="chart-title">💳 Payment Mode Breakdown</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={payModeData} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                {payModeData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue trend */}
        <div className="chart-card">
          <div className="chart-title">💹 Monthly Revenue Trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="card mt-24">
        <div className="card-header"><span className="card-title">🏆 Customer Revenue Breakdown</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Customer</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, idx) => (
                <tr key={c.name}>
                  <td className="text-accent fw-600">#{idx + 1}</td>
                  <td className="fw-600">{c.name}</td>
                  <td>{c.orders}</td>
                  <td className="fw-600 text-accent">₹{c.revenue.toLocaleString('en-IN')}</td>
                  <td>₹{Math.round(c.revenue / c.orders).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr><td colSpan={5} className="text-center" style={{ padding: 30, color: 'var(--text-muted)' }}>No data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Report Table */}
      <div className="card mt-24">
        <div className="card-header">
          <span className="card-title">📅 Daily Report</span>
          <button className="btn btn-secondary btn-sm" onClick={() => exportDailyReportExcel(dailyData, agencySettings, stock)}>📥 Export Excel</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Invoices</th>
                <th>Revenue</th>
                <th>Collected</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((d) => (
                <tr key={d.date}>
                  <td className="fw-600">{d.date}</td>
                  <td>{d.totalInvoices}</td>
                  <td className="fw-600 text-accent">₹{d.revenue.toLocaleString('en-IN')}</td>
                  <td className="text-success">₹{d.collected.toLocaleString('en-IN')}</td>
                  <td className="text-danger">₹{d.outstanding.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {dailyData.length === 0 && (
                <tr><td colSpan={5} className="text-center" style={{ padding: 30, color: 'var(--text-muted)' }}>No data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Report Table */}
      <div className="card mt-24">
        <div className="card-header">
          <span className="card-title">🗓️ Monthly Report</span>
          <button className="btn btn-secondary btn-sm" onClick={() => exportMonthlyReportExcel(monthlyDataReport, agencySettings, stock)}>📥 Export Excel</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Invoices</th>
                <th>Revenue</th>
                <th>Collected</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {monthlyDataReport.map((d) => (
                <tr key={d.month}>
                  <td className="fw-600">{d.month}</td>
                  <td>{d.totalInvoices}</td>
                  <td className="fw-600 text-accent">₹{d.revenue.toLocaleString('en-IN')}</td>
                  <td className="text-success">₹{d.collected.toLocaleString('en-IN')}</td>
                  <td className="text-danger">₹{d.outstanding.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {monthlyDataReport.length === 0 && (
                <tr><td colSpan={5} className="text-center" style={{ padding: 30, color: 'var(--text-muted)' }}>No data for selected period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
