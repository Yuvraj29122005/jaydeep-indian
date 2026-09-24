import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DEFAULT_AGENCY_SETTINGS } from '../lib/constants';

function getActiveAgencySettings(customSettings) {
  if (customSettings && customSettings.agencyName) {
    return { ...DEFAULT_AGENCY_SETTINGS, ...customSettings };
  }
  try {
    const saved = localStorage.getItem('jig_agency_settings');
    if (saved) return { ...DEFAULT_AGENCY_SETTINGS, ...JSON.parse(saved) };
  } catch (_e) {}
  return DEFAULT_AGENCY_SETTINGS;
}

export function exportInvoiceExcel(invoice, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const isEB = invoice.invoiceType === 'Empty Bottle';
  const ws_data = [
    [(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()],
    [`${settings.companyName || settings.agencyName} | ${settings.tagline || 'Authorized Indane LPG Distributor'}`],
    [`GSTIN: ${settings.gstin || '24ABCDE1234F1Z5'} | PAN: ${settings.panNumber || '—'} | Phone: ${settings.phone || '9876543210'}`],
    [`Address: ${[settings.address, settings.city, settings.state, settings.pincode].filter(Boolean).join(', ')}`],
    [],
    ['Invoice Type:', isEB ? 'Empty Bottle Collection Invoice' : 'Standard Refill Invoice'],
    ['Invoice Number:', invoice.invoiceNumber],
    ['Date:', invoice.date],
    ['Customer:', invoice.customerName],
    ['Phone:', invoice.customerPhone || '—'],
    ['Address:', invoice.customerAddress || '—'],
    ['Payment Mode:', invoice.paymentMode],
    ['Status:', invoice.deliveryStatus],
    ['Payment Status:', invoice.paymentStatus],
    [],
    isEB
      ? ['Cylinder Type', 'Empty Bottles Collected', 'Rate / Refund (Rs)', 'Amount (Rs)', 'Status']
      : ['Cylinder Type', 'Quantity (Filled)', 'Unit Price (Rs)', 'Market Price (Rs)', 'Discount (%)', 'Amount (Rs)', 'Empty Collected'],
    ...invoice.items.map(item => {
      const mktPrice = item.marketPrice || item.unitPrice;
      const discPct = mktPrice > 0 && item.unitPrice < mktPrice
        ? (((mktPrice - item.unitPrice) / mktPrice) * 100).toFixed(1)
        : '0.0';
      return isEB
        ? [
            item.cylinderType,
            item.qty,
            item.unitPrice,
            (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
            'Collected',
          ]
        : [
            item.cylinderType,
            item.qty,
            item.unitPrice,
            mktPrice,
            `${discPct}%`,
            (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
            item.emptyCollected ? `Yes (${item.emptyCount !== undefined ? item.emptyCount : item.qty})` : 'No',
          ];
    }),
    [],
    ['', '', '', '', '', 'Total Amount:', invoice.totalAmount],
    ['', '', '', '', '', 'Amount Paid:', invoice.paidAmount],
    ['', '', '', '', '', 'Balance Due:', invoice.totalAmount - (Number(invoice.paidAmount) || 0)],
    [],
    ['Bank Details:', `${settings.bankName} | A/C: ${settings.accountNumber} | IFSC: ${settings.ifscCode} | UPI: ${settings.upiId}`],
    ['Notes:', invoice.notes || '—'],
    ['Terms & Conditions:', settings.invoiceTerms || '—'],
    ['Footer Note:', settings.invoiceFooterNote || `Thank you for your business! — ${settings.agencyName}`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEB ? 'Empty Bottle Receipt' : 'Invoice');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${invoice.invoiceNumber}.xlsx`);
}

export function exportAllInvoicesExcel(invoices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = [
    'Invoice No', 'Type', 'Date', 'Customer', 'Phone', 'Address',
    'Items', 'Cylinder Types', 'Total Qty',
    'Total (Rs)', 'Paid (Rs)', 'Balance (Rs)',
    'Payment Mode', 'Delivery Status', 'Payment Status', 'Notes'
  ];

  const rows = invoices.map(inv => {
    const totalQty = inv.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const cylTypes = [...new Set(inv.items.map(i => i.cylinderType))].join(', ');
    return [
      inv.invoiceNumber,
      inv.invoiceType === 'Empty Bottle' ? 'Empty Bottle' : 'Refill',
      inv.date,
      inv.customerName,
      inv.customerPhone,
      inv.customerAddress,
      inv.items.map(i => `${i.qty}x${i.cylinderType}${inv.invoiceType === 'Empty Bottle' ? ' (Empty)' : ''}`).join(', '),
      cylTypes,
      totalQty,
      inv.totalAmount,
      inv.paidAmount,
      inv.totalAmount - (Number(inv.paidAmount) || 0),
      inv.paymentMode,
      inv.deliveryStatus,
      inv.paymentStatus,
      inv.notes || '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — ALL INVOICES`],
    [`GSTIN: ${settings.gstin || '—'} | Phone: ${settings.phone || '—'}`],
    [],
    headers,
    ...rows
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${(settings.invoicePrefix || 'JIG')}-All-Invoices.xlsx`);
}

export function exportCustomersExcel(customers, marketPrices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];

  const headers = [
    'Customer ID', 'Name', 'Phone', 'Address', 'Customer Type',
    ...cylTypes.map(t => `${t} Price (Rs)`),
    ...cylTypes.map(t => `${t} Discount (%)`),
    ...cylTypes.map(t => `${t} Filled Given`),
    ...cylTypes.map(t => `${t} Empty Collected`),
    ...cylTypes.map(t => `${t} Pending Empty`),
  ];

  const rows = customers.map(c => {
    const custPrices = c.prices || {};
    const bal = c.bottleBalance || {};
    const stock = c.emptyBottleStock || {};

    const priceCols = cylTypes.map(t => {
      return custPrices[t] !== undefined ? Number(custPrices[t]) : (Number(mkt[t]) || 0);
    });

    const discCols = cylTypes.map(t => {
      const mktP = Number(mkt[t]) || 0;
      const custP = custPrices[t] !== undefined ? Number(custPrices[t]) : mktP;
      if (mktP > 0 && custP < mktP) {
        return `${(((mktP - custP) / mktP) * 100).toFixed(1)}%`;
      }
      return '0.0%';
    });

    const filledCols = cylTypes.map(t => bal[t]?.filledGiven || 0);
    const collectedCols = cylTypes.map(t => bal[t]?.emptyCollected || 0);
    const pendingCols = cylTypes.map(t => {
      const s = stock[t] || { withCustomer: 0, collected: 0 };
      return Math.max(0, (s.withCustomer || 0) - (s.collected || 0));
    });

    return [
      c.id, c.name, c.phone, c.address, c.type || 'N/A',
      ...priceCols,
      ...discCols,
      ...filledCols,
      ...collectedCols,
      ...pendingCols,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — CUSTOMER DIRECTORY`],
    [],
    headers,
    ...rows
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  const marketSheet = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — Current Market Prices`],
    [],
    ['Cylinder Type', 'Market Price (Rs)'],
    ...cylTypes.map(t => [t, Number(mkt[t]) || 0]),
    [],
    ['Last Updated:', new Date().toLocaleString('en-IN')],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(marketSheet);
  ws2['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Market Prices');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${(settings.invoicePrefix || 'JIG')}-Customers.xlsx`);
}

export function exportStockExcel(stock, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Cylinder Type', 'Filled Bottles', 'Empty Bottles', 'Total', 'Fill Rate (%)'];
  const rows = stock.map(s => {
    const total = s.filledCount + s.emptyCount;
    const fillRate = total > 0 ? ((s.filledCount / total) * 100).toFixed(1) : '0.0';
    return [s.cylinderType, s.filledCount, s.emptyCount, total, `${fillRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — INVENTORY STOCK REPORT`],
    [],
    headers,
    ...rows
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${(settings.invoicePrefix || 'JIG')}-Stock-Report.xlsx`);
}

export function exportDailyReportExcel(data, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Date', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)', 'Collection Rate (%)'];
  const rows = data.map(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    return [d.date, d.totalInvoices, d.revenue, d.collected, d.outstanding, `${collRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — DAILY REPORT`],
    [],
    headers,
    ...rows
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${(settings.invoicePrefix || 'JIG')}-Daily-Report.xlsx`);
}

export function exportMonthlyReportExcel(data, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Month', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)', 'Collection Rate (%)'];
  const rows = data.map(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    return [d.month, d.totalInvoices, d.revenue, d.collected, d.outstanding, `${collRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — MONTHLY REPORT`],
    [],
    headers,
    ...rows
  ]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${(settings.invoicePrefix || 'JIG')}-Monthly-Report.xlsx`);
}

export function exportCustomerReportExcel(customer, invoices, marketPrices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalDue = totalBusiness - totalPaid;

  const summaryData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} - CUSTOMER STATEMENT`],
    [`GSTIN: ${settings.gstin || '—'} | Phone: ${settings.phone || '—'}`],
    [],
    ['Customer Name:', customer.name],
    ['Phone:', customer.phone],
    ['Address:', customer.address || '—'],
    ['Customer Type:', customer.type || 'N/A'],
    [],
    ['=== PRICING & DISCOUNT COMPARISON ==='],
    ['Cylinder Type', 'Market Price (Rs)', 'Customer Price (Rs)', 'Discount Amount (Rs)', 'Discount (%)'],
    ...cylTypes.map(t => {
      const mktP = Number(mkt[t]) || 0;
      const custP = customer.prices?.[t] !== undefined ? Number(customer.prices[t]) : mktP;
      const discAmt = Math.max(0, mktP - custP);
      const discPct = mktP > 0 ? ((discAmt / mktP) * 100).toFixed(1) : '0.0';
      return [t, mktP, custP, discAmt, `${discPct}%`];
    }),
    [],
    ['=== FINANCIAL SUMMARY ==='],
    ['Total Business (Rs):', totalBusiness],
    ['Total Paid (Rs):', totalPaid],
    ['Balance Due (Rs):', totalDue],
    ['Collection Rate:', totalBusiness > 0 ? `${((totalPaid / totalBusiness) * 100).toFixed(1)}%` : 'N/A'],
    [],
    ['=== TRANSACTION HISTORY ==='],
    ['Date', 'Invoice No', 'Type', 'Items', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Notes']
  ];

  const rows = invoices.map(inv => {
    const isEB = inv.invoiceType === 'Empty Bottle';
    return [
      inv.date,
      inv.invoiceNumber,
      isEB ? 'Empty Bottle' : 'Refill',
      inv.items.map(i => `${i.qty}x${i.cylinderType}${isEB ? ' (Empty)' : ''}`).join(', '),
      inv.totalAmount,
      inv.paidAmount,
      inv.totalAmount - (Number(inv.paidAmount) || 0),
      inv.paymentStatus,
      inv.notes || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...summaryData, ...rows]);
  ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Statement-${customer.name.replace(/\s+/g, '-')}.xlsx`);
}
