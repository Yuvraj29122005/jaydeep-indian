import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { DEFAULT_AGENCY_SETTINGS } from '../lib/constants';

// ───────────────────────────────────────────────────────────────
// PROFESSIONAL EXCEL STYLING CONSTANTS
// ───────────────────────────────────────────────────────────────

const COLORS = {
  headerBg: '1B4F72',       // Deep professional blue
  headerFont: 'FFFFFF',     // White text on header
  titleBg: '0D3B66',        // Dark navy for titles
  titleFont: 'FFFFFF',
  subtitleBg: '2E86C1',     // Medium blue for subtitles
  subtitleFont: 'FFFFFF',
  sectionBg: 'D4E6F1',      // Light blue for section labels
  sectionFont: '1B4F72',
  altRowBg: 'F2F8FD',       // Very light blue alternating rows
  totalsBg: 'E8F5E9',       // Light green for totals
  totalsFont: '1B5E20',
  warningBg: 'FFF3E0',      // Light orange for warnings
  warningFont: 'E65100',
  dangerBg: 'FFEBEE',       // Light red for danger/balance due
  dangerFont: 'C62828',
  successBg: 'E8F5E9',
  successFont: '2E7D32',
  borderColor: 'B0BEC5',    // Subtle gray borders
  accentBg: 'FFF8E1',       // Light amber for accent rows
  footerBg: 'ECEFF1',       // Light gray for footer
  footerFont: '546E7A',
};

const FONT = {
  title: { name: 'Calibri', sz: 16, bold: true, color: { rgb: COLORS.titleFont } },
  subtitle: { name: 'Calibri', sz: 11, bold: false, color: { rgb: COLORS.subtitleFont } },
  header: { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.headerFont } },
  section: { name: 'Calibri', sz: 12, bold: true, color: { rgb: COLORS.sectionFont } },
  normal: { name: 'Calibri', sz: 10, color: { rgb: '263238' } },
  bold: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '263238' } },
  currency: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1B5E20' } },
  danger: { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.dangerFont } },
  success: { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.successFont } },
  footer: { name: 'Calibri', sz: 9, italic: true, color: { rgb: COLORS.footerFont } },
  totalLabel: { name: 'Calibri', sz: 11, bold: true, color: { rgb: COLORS.totalsFont } },
  totalValue: { name: 'Calibri', sz: 12, bold: true, color: { rgb: COLORS.totalsFont } },
};

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { rgb: COLORS.borderColor } },
  left: { style: 'thin', color: { rgb: COLORS.borderColor } },
  right: { style: 'thin', color: { rgb: COLORS.borderColor } },
};

const BORDER_MEDIUM_BOTTOM = {
  ...BORDER_THIN,
  bottom: { style: 'medium', color: { rgb: COLORS.headerBg } },
};

const ALIGN_CENTER = { horizontal: 'center', vertical: 'center', wrapText: true };
const ALIGN_LEFT = { horizontal: 'left', vertical: 'center', wrapText: true };
const ALIGN_RIGHT = { horizontal: 'right', vertical: 'center', wrapText: true };

// ───────────────────────────────────────────────────────────────
// STYLE PRESETS
// ───────────────────────────────────────────────────────────────

const STYLES = {
  title: { font: FONT.title, fill: { fgColor: { rgb: COLORS.titleBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  subtitle: { font: FONT.subtitle, fill: { fgColor: { rgb: COLORS.subtitleBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  header: { font: FONT.header, fill: { fgColor: { rgb: COLORS.headerBg } }, alignment: ALIGN_CENTER, border: BORDER_MEDIUM_BOTTOM },
  section: { font: FONT.section, fill: { fgColor: { rgb: COLORS.sectionBg } }, alignment: ALIGN_LEFT, border: BORDER_THIN },
  normal: { font: FONT.normal, alignment: ALIGN_LEFT, border: BORDER_THIN },
  normalCenter: { font: FONT.normal, alignment: ALIGN_CENTER, border: BORDER_THIN },
  normalRight: { font: FONT.normal, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  bold: { font: FONT.bold, alignment: ALIGN_LEFT, border: BORDER_THIN },
  boldCenter: { font: FONT.bold, alignment: ALIGN_CENTER, border: BORDER_THIN },
  currency: { font: FONT.currency, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  danger: { font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } }, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  success: { font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } }, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  totalLabel: { font: FONT.totalLabel, fill: { fgColor: { rgb: COLORS.totalsBg } }, alignment: ALIGN_RIGHT, border: BORDER_MEDIUM_BOTTOM },
  totalValue: { font: FONT.totalValue, fill: { fgColor: { rgb: COLORS.totalsBg } }, alignment: ALIGN_RIGHT, border: BORDER_MEDIUM_BOTTOM },
  footer: { font: FONT.footer, fill: { fgColor: { rgb: COLORS.footerBg } }, alignment: ALIGN_LEFT, border: BORDER_THIN },
  altRow: { font: FONT.normal, fill: { fgColor: { rgb: COLORS.altRowBg } }, alignment: ALIGN_LEFT, border: BORDER_THIN },
  altRowCenter: { font: FONT.normal, fill: { fgColor: { rgb: COLORS.altRowBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  altRowRight: { font: FONT.normal, fill: { fgColor: { rgb: COLORS.altRowBg } }, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  altRowBold: { font: FONT.bold, fill: { fgColor: { rgb: COLORS.altRowBg } }, alignment: ALIGN_LEFT, border: BORDER_THIN },
  altRowCurrency: { font: FONT.currency, fill: { fgColor: { rgb: COLORS.altRowBg } }, alignment: ALIGN_RIGHT, border: BORDER_THIN },
  warningCell: { font: { ...FONT.bold, color: { rgb: COLORS.warningFont } }, fill: { fgColor: { rgb: COLORS.warningBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
};

// ───────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ───────────────────────────────────────────────────────────────

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

function formatCurrency(val) {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (_e) {
    return dateStr;
  }
}

/** Apply style to a cell in a worksheet */
function styleCell(ws, cellRef, style) {
  if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
  ws[cellRef].s = style;
}

/** Apply styles to a row of cells */
function styleRow(ws, row, startCol, endCol, style) {
  for (let c = startCol; c <= endCol; c++) {
    const ref = XLSX.utils.encode_cell({ r: row, c });
    styleCell(ws, ref, style);
  }
}

/** Apply alternating row styles to data rows */
function styleDataRows(ws, startRow, endRow, colCount, colStyles) {
  for (let r = startRow; r <= endRow; r++) {
    const isAlt = (r - startRow) % 2 === 1;
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: '', t: 's' };
      const align = colStyles?.[c] || 'left';
      if (isAlt) {
        ws[ref].s = align === 'center' ? STYLES.altRowCenter
          : align === 'right' ? STYLES.altRowRight
          : align === 'currency' ? STYLES.altRowCurrency
          : align === 'bold' ? STYLES.altRowBold
          : STYLES.altRow;
      } else {
        ws[ref].s = align === 'center' ? STYLES.normalCenter
          : align === 'right' ? STYLES.normalRight
          : align === 'currency' ? STYLES.currency
          : align === 'bold' ? STYLES.bold
          : STYLES.normal;
      }
    }
  }
}

/** Create a merged title row */
function addTitleRow(wsData, text) {
  wsData.push([text]);
}

/** Build and save workbook */
function saveWorkbook(wb, filename) {
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}

/** Add stock summary section to a worksheet data array */
function buildStockSummaryRows(stock) {
  if (!stock || !Array.isArray(stock) || stock.length === 0) return [];
  const rows = [
    [],
    ['CURRENT STOCK INVENTORY'],
    ['Cylinder Type', 'Filled Bottles', 'Empty Bottles', 'Total Stock', 'Fill Rate (%)'],
  ];
  let totalFilled = 0, totalEmpty = 0;
  stock.forEach(s => {
    const total = (s.filledCount || 0) + (s.emptyCount || 0);
    const fillRate = total > 0 ? ((s.filledCount / total) * 100).toFixed(1) : '0.0';
    totalFilled += (s.filledCount || 0);
    totalEmpty += (s.emptyCount || 0);
    rows.push([s.cylinderType, s.filledCount || 0, s.emptyCount || 0, total, `${fillRate}%`]);
  });
  const grandTotal = totalFilled + totalEmpty;
  const grandFillRate = grandTotal > 0 ? ((totalFilled / grandTotal) * 100).toFixed(1) : '0.0';
  rows.push(['TOTAL', totalFilled, totalEmpty, grandTotal, `${grandFillRate}%`]);
  return rows;
}

/** Style stock summary section in a worksheet */
function styleStockSection(ws, startRow, stockRowCount, totalCols) {
  // Section header
  const sectionRow = startRow + 1;
  styleRow(ws, sectionRow, 0, totalCols - 1, STYLES.section);
  if (totalCols > 1) ws['!merges'] = (ws['!merges'] || []).concat([{ s: { r: sectionRow, c: 0 }, e: { r: sectionRow, c: totalCols - 1 } }]);

  // Column headers
  const headerRow = startRow + 2;
  for (let c = 0; c < 5; c++) {
    const ref = XLSX.utils.encode_cell({ r: headerRow, c });
    styleCell(ws, ref, STYLES.header);
  }

  // Data rows
  for (let i = 0; i < stockRowCount; i++) {
    const r = headerRow + 1 + i;
    const isTotal = i === stockRowCount - 1;
    for (let c = 0; c < 5; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (isTotal) {
        styleCell(ws, ref, STYLES.totalLabel);
      } else {
        styleCell(ws, ref, i % 2 === 1 ? STYLES.altRowCenter : STYLES.normalCenter);
      }
    }
    // Bold the type column
    const typeRef = XLSX.utils.encode_cell({ r, c: 0 });
    if (isTotal) {
      styleCell(ws, typeRef, STYLES.totalLabel);
    } else {
      styleCell(ws, typeRef, i % 2 === 1 ? STYLES.altRowBold : STYLES.bold);
    }
  }
}


// ═══════════════════════════════════════════════════════════════
// 1. SINGLE INVOICE EXPORT
// ═══════════════════════════════════════════════════════════════

export function exportInvoiceExcel(invoice, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const isEB = invoice.invoiceType === 'Empty Bottle';

  const wsData = [
    [(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()],
    [settings.tagline || 'Authorized Indane LPG Distributor'],
    [`GSTIN: ${settings.gstin || '—'}  |  PAN: ${settings.panNumber || '—'}`],
    [],
    ['Invoice Type:', isEB ? 'Empty Bottle Collection Invoice' : 'Standard Refill Invoice'],
    ['Invoice Number:', invoice.invoiceNumber],
    ['Date:', formatDate(invoice.date)],
    ['Customer:', invoice.customerName],
    ['Payment Mode:', invoice.paymentMode],
    ['Payment Status:', invoice.paymentStatus],
    [],
  ];

  // Item table headers
  const itemHeaders = isEB
    ? ['Cylinder Type', 'Empty Bottles Collected', 'Rate / Refund (₹)', 'Amount (₹)']
    : ['Cylinder Type', 'Quantity', 'Unit Price (₹)', 'Market Price (₹)', 'Discount (%)', 'Amount (₹)', 'Empty Collected'];

  wsData.push(itemHeaders);

  const itemStartRow = wsData.length;
  invoice.items.forEach(item => {
    const mktPrice = item.marketPrice || item.unitPrice;
    const discPct = mktPrice > 0 && item.unitPrice < mktPrice
      ? (((mktPrice - item.unitPrice) / mktPrice) * 100).toFixed(1) : '0.0';
    const amount = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);

    wsData.push(
      isEB
        ? [item.cylinderType, item.qty, formatCurrency(item.unitPrice), formatCurrency(amount)]
        : [
            item.cylinderType, item.qty,
            formatCurrency(item.unitPrice), formatCurrency(mktPrice),
            `${discPct}%`, formatCurrency(amount),
            item.emptyCollected ? `Yes (${item.emptyCount !== undefined ? item.emptyCount : item.qty})` : 'No',
          ]
    );
  });

  const colCount = itemHeaders.length;
  wsData.push([]);

  // Totals
  wsData.push([...Array(colCount - 2).fill(''), 'Total Amount:', formatCurrency(invoice.totalAmount)]);
  wsData.push([...Array(colCount - 2).fill(''), 'Amount Paid:', formatCurrency(invoice.paidAmount)]);
  wsData.push([...Array(colCount - 2).fill(''), 'Balance Due:', formatCurrency(invoice.totalAmount - (Number(invoice.paidAmount) || 0))]);
  wsData.push([]);

  // Bank Details
  wsData.push(['Bank Details:', `${settings.bankName} | A/C: ${settings.accountNumber} | IFSC: ${settings.ifscCode} | UPI: ${settings.upiId}`]);
  if (invoice.notes) wsData.push(['Notes:', invoice.notes]);
  wsData.push(['', `Thank you for your business! — ${settings.agencyName}`]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = isEB
    ? [{ wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 18 }]
    : [{ wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];

  // Merges for title rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
  ];

  // Style title rows
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws, 2, 0, colCount - 1, STYLES.subtitle);

  // Style detail rows (4-9)
  for (let r = 4; r <= 9; r++) {
    const labelRef = XLSX.utils.encode_cell({ r, c: 0 });
    const valRef = XLSX.utils.encode_cell({ r, c: 1 });
    styleCell(ws, labelRef, STYLES.bold);
    styleCell(ws, valRef, STYLES.normal);
  }

  // Style item headers
  const itemHeaderRow = itemStartRow - 1;
  styleRow(ws, itemHeaderRow, 0, colCount - 1, STYLES.header);

  // Style item data rows
  const itemEndRow = itemStartRow + invoice.items.length - 1;
  const itemColStyles = isEB
    ? ['bold', 'center', 'right', 'right']
    : ['bold', 'center', 'right', 'right', 'center', 'right', 'center'];
  styleDataRows(ws, itemStartRow, itemEndRow, colCount, itemColStyles);

  // Style totals
  const totalsStart = itemEndRow + 2;
  for (let i = 0; i < 3; i++) {
    const r = totalsStart + i;
    const labelRef = XLSX.utils.encode_cell({ r, c: colCount - 2 });
    const valRef = XLSX.utils.encode_cell({ r, c: colCount - 1 });
    styleCell(ws, labelRef, i === 2 ? { ...STYLES.totalLabel, font: FONT.danger } : STYLES.totalLabel);
    styleCell(ws, valRef, i === 2
      ? { ...STYLES.totalValue, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } }
      : STYLES.totalValue);
  }

  // Style footer rows
  const footerStart = totalsStart + 4;
  for (let r = footerStart; r < wsData.length; r++) {
    styleRow(ws, r, 0, colCount - 1, STYLES.footer);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEB ? 'Empty Bottle Receipt' : 'Invoice');
  saveWorkbook(wb, `${invoice.invoiceNumber}.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 2. ALL INVOICES REPORT
// ═══════════════════════════════════════════════════════════════

export function exportAllInvoicesExcel(invoices, customSettings = null, stock = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = [
    'Invoice No', 'Type', 'Date', 'Customer',
    'Items Summary', 'Cylinder Types', 'Total Qty',
    'Total (₹)', 'Paid (₹)', 'Balance (₹)',
    'Payment Mode', 'Payment Status',
  ];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — ALL INVOICES REPORT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Invoices: ${invoices.length}`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  let grandTotal = 0, grandPaid = 0;

  invoices.forEach(inv => {
    const totalQty = inv.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const cylTypes = [...new Set(inv.items.map(i => i.cylinderType))].join(', ');
    const balance = inv.totalAmount - (Number(inv.paidAmount) || 0);
    grandTotal += inv.totalAmount;
    grandPaid += Number(inv.paidAmount) || 0;

    wsData.push([
      inv.invoiceNumber,
      inv.invoiceType === 'Empty Bottle' ? 'Empty Bottle' : 'Refill',
      formatDate(inv.date),
      inv.customerName,
      inv.items.map(i => `${i.qty}×${i.cylinderType}`).join(', '),
      cylTypes,
      totalQty,
      formatCurrency(inv.totalAmount),
      formatCurrency(inv.paidAmount),
      formatCurrency(balance),
      inv.paymentMode,
      inv.paymentStatus,
    ]);
  });

  const dataEndRow = wsData.length - 1;

  // Grand totals row
  wsData.push([
    '', '', '', '', '', '', 'GRAND TOTAL',
    formatCurrency(grandTotal), formatCurrency(grandPaid), formatCurrency(grandTotal - grandPaid),
    '', '',
  ]);
  const totalRow = wsData.length - 1;

  // Stock summary
  const stockRows = buildStockSummaryRows(stock);
  const stockStartRow = wsData.length;
  wsData.push(...stockRows);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    { wch: 28 }, { wch: 16 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 },
  ];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // Style title rows
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);

  // Style headers
  styleRow(ws, 3, 0, colCount - 1, STYLES.header);

  // Style data rows with alternating colors
  const colStyles = ['bold', 'center', 'center', 'left', 'left', 'center', 'center', 'right', 'right', 'right', 'center', 'center'];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  // Style payment status cells with conditional coloring
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const statusRef = XLSX.utils.encode_cell({ r, c: 11 });
    if (ws[statusRef]) {
      const val = String(ws[statusRef].v || '').toLowerCase();
      if (val === 'paid' || val === 'full') {
        ws[statusRef].s = (r - dataStartRow) % 2 === 1
          ? { ...STYLES.altRowCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } }
          : { ...STYLES.normalCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } };
      } else if (val === 'unpaid' || val === 'pending') {
        ws[statusRef].s = (r - dataStartRow) % 2 === 1
          ? { ...STYLES.altRowCenter, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } }
          : { ...STYLES.normalCenter, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } };
      } else if (val === 'partial') {
        ws[statusRef].s = { ...STYLES.warningCell };
      }
    }
  }

  // Style grand total row
  styleRow(ws, totalRow, 0, colCount - 1, STYLES.totalLabel);

  // Style stock section
  if (stockRows.length > 0) {
    styleStockSection(ws, stockStartRow, stock.length + 1, colCount);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');
  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-All-Invoices.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 3. CUSTOMERS DIRECTORY EXPORT
// ═══════════════════════════════════════════════════════════════

export function exportCustomersExcel(customers, marketPrices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];

  const headers = [
    'Sr No', 'Customer Name', 'Customer Type',
    ...cylTypes.map(t => `${t} Price (₹)`),
    ...cylTypes.map(t => `${t} Discount (%)`),
    ...cylTypes.map(t => `${t} Filled Given`),
    ...cylTypes.map(t => `${t} Empty Collected`),
    ...cylTypes.map(t => `${t} Pending Empty`),
  ];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — CUSTOMER DIRECTORY`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Customers: ${customers.length}`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  customers.forEach((c, idx) => {
    const custPrices = c.prices || {};
    const bal = c.bottleBalance || {};
    const stock = c.emptyBottleStock || {};

    const priceCols = cylTypes.map(t => {
      return formatCurrency(custPrices[t] !== undefined ? Number(custPrices[t]) : (Number(mkt[t]) || 0));
    });

    const discCols = cylTypes.map(t => {
      const mktP = Number(mkt[t]) || 0;
      const custP = custPrices[t] !== undefined ? Number(custPrices[t]) : mktP;
      if (mktP > 0 && custP < mktP) return `${(((mktP - custP) / mktP) * 100).toFixed(1)}%`;
      return '0.0%';
    });

    const filledCols = cylTypes.map(t => bal[t]?.filledGiven || 0);
    const collectedCols = cylTypes.map(t => bal[t]?.emptyCollected || 0);
    const pendingCols = cylTypes.map(t => {
      const s = stock[t] || { withCustomer: 0, collected: 0 };
      return Math.max(0, (s.withCustomer || 0) - (s.collected || 0));
    });

    wsData.push([
      idx + 1, c.name, c.type || 'N/A',
      ...priceCols, ...discCols, ...filledCols, ...collectedCols, ...pendingCols,
    ]);
  });

  const dataEndRow = wsData.length - 1;

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 8 }, { wch: 22 }, { wch: 14 },
    ...Array(15).fill({ wch: 14 }),
  ];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // Style
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws, 3, 0, colCount - 1, STYLES.header);

  const colStyles = ['center', 'bold', 'center', ...Array(15).fill('center')];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  // Market Prices sheet
  const mktData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — MARKET PRICES`],
    [],
    ['Cylinder Type', 'Market Price (₹)'],
    ...cylTypes.map(t => [t, formatCurrency(Number(mkt[t]) || 0)]),
    [],
    ['Last Updated:', new Date().toLocaleString('en-IN')],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(mktData);
  ws2['!cols'] = [{ wch: 20 }, { wch: 20 }];
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  styleRow(ws2, 0, 0, 1, STYLES.title);
  styleRow(ws2, 2, 0, 1, STYLES.header);
  for (let r = 3; r <= 5; r++) {
    styleCell(ws2, XLSX.utils.encode_cell({ r, c: 0 }), r % 2 === 1 ? STYLES.altRowBold : STYLES.bold);
    styleCell(ws2, XLSX.utils.encode_cell({ r, c: 1 }), r % 2 === 1 ? STYLES.altRowCurrency : STYLES.currency);
  }
  styleCell(ws2, XLSX.utils.encode_cell({ r: 7, c: 0 }), STYLES.footer);
  styleCell(ws2, XLSX.utils.encode_cell({ r: 7, c: 1 }), STYLES.footer);

  XLSX.utils.book_append_sheet(wb, ws2, 'Market Prices');
  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-Customers.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 4. STOCK INVENTORY REPORT
// ═══════════════════════════════════════════════════════════════

export function exportStockExcel(stock, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Cylinder Type', 'Filled Bottles', 'Empty Bottles', 'Total Stock', 'Fill Rate (%)', 'Status'];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — INVENTORY STOCK REPORT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  let totalFilled = 0, totalEmpty = 0;

  stock.forEach(s => {
    const total = s.filledCount + s.emptyCount;
    const fillRate = total > 0 ? ((s.filledCount / total) * 100).toFixed(1) : '0.0';
    const status = s.filledCount === 0 ? '🔴 Out of Stock' : s.filledCount < 10 ? '🟡 Low Stock' : '🟢 Adequate';
    totalFilled += s.filledCount;
    totalEmpty += s.emptyCount;

    wsData.push([s.cylinderType, s.filledCount, s.emptyCount, total, `${fillRate}%`, status]);
  });

  const dataEndRow = wsData.length - 1;

  // Grand total row
  const grandTotal = totalFilled + totalEmpty;
  const grandFillRate = grandTotal > 0 ? ((totalFilled / grandTotal) * 100).toFixed(1) : '0.0';
  wsData.push(['GRAND TOTAL', totalFilled, totalEmpty, grandTotal, `${grandFillRate}%`, '']);
  const totalRow = wsData.length - 1;

  // Summary info
  wsData.push([]);
  wsData.push(['INVENTORY SUMMARY']);
  wsData.push(['Total Filled Bottles:', totalFilled]);
  wsData.push(['Total Empty Bottles:', totalEmpty]);
  wsData.push(['Grand Total Cylinders:', grandTotal]);
  wsData.push(['Overall Fill Rate:', `${grandFillRate}%`]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: totalRow + 2, c: 0 }, e: { r: totalRow + 2, c: colCount - 1 } },
  ];

  // Style
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws, 3, 0, colCount - 1, STYLES.header);

  const colStyles = ['bold', 'center', 'center', 'center', 'center', 'center'];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  // Style status cells conditionally
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const statusRef = XLSX.utils.encode_cell({ r, c: 5 });
    if (ws[statusRef]) {
      const val = String(ws[statusRef].v || '');
      if (val.includes('Out of Stock')) {
        ws[statusRef].s = { ...STYLES.normalCenter, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } };
      } else if (val.includes('Low Stock')) {
        ws[statusRef].s = STYLES.warningCell;
      } else if (val.includes('Adequate')) {
        ws[statusRef].s = { ...STYLES.normalCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } };
      }
    }
  }

  // Style total row
  styleRow(ws, totalRow, 0, colCount - 1, STYLES.totalLabel);

  // Style summary section
  styleRow(ws, totalRow + 2, 0, colCount - 1, STYLES.section);
  for (let r = totalRow + 3; r < wsData.length; r++) {
    styleCell(ws, XLSX.utils.encode_cell({ r, c: 0 }), STYLES.bold);
    styleCell(ws, XLSX.utils.encode_cell({ r, c: 1 }), STYLES.boldCenter);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-Stock-Report.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 5. DAILY REPORT
// ═══════════════════════════════════════════════════════════════

export function exportDailyReportExcel(data, customSettings = null, stock = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Date', 'Total Invoices', 'Revenue (₹)', 'Collected (₹)', 'Outstanding (₹)', 'Collection Rate (%)'];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — DAILY REPORT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Period: ${data.length} days`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  let totalInv = 0, totalRev = 0, totalColl = 0;

  data.forEach(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    totalInv += d.totalInvoices;
    totalRev += d.revenue;
    totalColl += d.collected;
    wsData.push([
      formatDate(d.date), d.totalInvoices,
      formatCurrency(d.revenue), formatCurrency(d.collected),
      formatCurrency(d.outstanding), `${collRate}%`
    ]);
  });

  const dataEndRow = wsData.length - 1;

  // Totals
  const totalCollRate = totalRev > 0 ? ((totalColl / totalRev) * 100).toFixed(1) : '0.0';
  wsData.push([
    'GRAND TOTAL', totalInv,
    formatCurrency(totalRev), formatCurrency(totalColl),
    formatCurrency(totalRev - totalColl), `${totalCollRate}%`
  ]);
  const totalRow = wsData.length - 1;

  // Stock summary
  const stockRows = buildStockSummaryRows(stock);
  const stockStartRow = wsData.length;
  wsData.push(...stockRows);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // Style
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws, 3, 0, colCount - 1, STYLES.header);

  const colStyles = ['bold', 'center', 'right', 'right', 'right', 'center'];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  // Style outstanding column with danger color when > 0
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const outRef = XLSX.utils.encode_cell({ r, c: 4 });
    if (ws[outRef]) {
      const val = String(ws[outRef].v || '').replace(/[₹,]/g, '');
      if (Number(val) > 0) {
        const isAlt = (r - dataStartRow) % 2 === 1;
        ws[outRef].s = {
          font: FONT.danger,
          fill: { fgColor: { rgb: isAlt ? COLORS.altRowBg : COLORS.dangerBg } },
          alignment: ALIGN_RIGHT,
          border: BORDER_THIN,
        };
      }
    }
  }

  // Style total row
  styleRow(ws, totalRow, 0, colCount - 1, STYLES.totalLabel);

  // Style stock section
  if (stockRows.length > 0) {
    styleStockSection(ws, stockStartRow, (stock?.length || 0) + 1, colCount);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-Daily-Report.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 6. MONTHLY REPORT
// ═══════════════════════════════════════════════════════════════

export function exportMonthlyReportExcel(data, customSettings = null, stock = null) {
  const settings = getActiveAgencySettings(customSettings);
  const headers = ['Month', 'Total Invoices', 'Revenue (₹)', 'Collected (₹)', 'Outstanding (₹)', 'Collection Rate (%)'];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — MONTHLY REPORT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Months: ${data.length}`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  let totalInv = 0, totalRev = 0, totalColl = 0;

  data.forEach(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    totalInv += d.totalInvoices;
    totalRev += d.revenue;
    totalColl += d.collected;
    wsData.push([
      d.month, d.totalInvoices,
      formatCurrency(d.revenue), formatCurrency(d.collected),
      formatCurrency(d.outstanding), `${collRate}%`
    ]);
  });

  const dataEndRow = wsData.length - 1;

  // Totals
  const totalCollRate = totalRev > 0 ? ((totalColl / totalRev) * 100).toFixed(1) : '0.0';
  wsData.push([
    'GRAND TOTAL', totalInv,
    formatCurrency(totalRev), formatCurrency(totalColl),
    formatCurrency(totalRev - totalColl), `${totalCollRate}%`
  ]);
  const totalRow = wsData.length - 1;

  // Stock summary
  const stockRows = buildStockSummaryRows(stock);
  const stockStartRow = wsData.length;
  wsData.push(...stockRows);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
  ];

  // Style
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws, 3, 0, colCount - 1, STYLES.header);

  const colStyles = ['bold', 'center', 'right', 'right', 'right', 'center'];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  // Style outstanding column
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const outRef = XLSX.utils.encode_cell({ r, c: 4 });
    if (ws[outRef]) {
      const val = String(ws[outRef].v || '').replace(/[₹,]/g, '');
      if (Number(val) > 0) {
        const isAlt = (r - dataStartRow) % 2 === 1;
        ws[outRef].s = {
          font: FONT.danger,
          fill: { fgColor: { rgb: isAlt ? COLORS.altRowBg : COLORS.dangerBg } },
          alignment: ALIGN_RIGHT,
          border: BORDER_THIN,
        };
      }
    }
  }

  // Style total row
  styleRow(ws, totalRow, 0, colCount - 1, STYLES.totalLabel);

  // Style stock section
  if (stockRows.length > 0) {
    styleStockSection(ws, stockStartRow, (stock?.length || 0) + 1, colCount);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-Monthly-Report.xlsx`);
}


// ═══════════════════════════════════════════════════════════════
// 7. CUSTOMER STATEMENT REPORT
// ═══════════════════════════════════════════════════════════════

export function exportCustomerReportExcel(customer, invoices, marketPrices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalDue = totalBusiness - totalPaid;
  const colCount = 8;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — CUSTOMER STATEMENT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    ['CUSTOMER DETAILS'],
    ['Customer Name:', customer.name],
    ['Customer Type:', customer.type || 'N/A'],
    ['Total Invoices:', invoices.length],
    [],
    ['PRICING & DISCOUNT COMPARISON'],
    ['Cylinder Type', 'Market Price (₹)', 'Customer Price (₹)', 'Discount (₹)', 'Discount (%)'],
  ];

  const pricingStartRow = wsData.length;
  cylTypes.forEach(t => {
    const mktP = Number(mkt[t]) || 0;
    const custP = customer.prices?.[t] !== undefined ? Number(customer.prices[t]) : mktP;
    const discAmt = Math.max(0, mktP - custP);
    const discPct = mktP > 0 ? ((discAmt / mktP) * 100).toFixed(1) : '0.0';
    wsData.push([t, formatCurrency(mktP), formatCurrency(custP), formatCurrency(discAmt), `${discPct}%`]);
  });
  const pricingEndRow = wsData.length - 1;

  wsData.push([]);
  wsData.push(['FINANCIAL SUMMARY']);
  const summaryStartRow = wsData.length;
  wsData.push(['Total Business (₹):', formatCurrency(totalBusiness)]);
  wsData.push(['Total Paid (₹):', formatCurrency(totalPaid)]);
  wsData.push(['Balance Due (₹):', formatCurrency(totalDue)]);
  wsData.push(['Collection Rate:', totalBusiness > 0 ? `${((totalPaid / totalBusiness) * 100).toFixed(1)}%` : 'N/A']);

  wsData.push([]);
  wsData.push(['TRANSACTION HISTORY']);

  const txnHeaders = ['Date', 'Invoice No', 'Type', 'Items Summary', 'Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Payment Status'];
  wsData.push(txnHeaders);
  const txnHeaderRow = wsData.length - 1;
  const txnStartRow = wsData.length;

  invoices.forEach(inv => {
    const isEB = inv.invoiceType === 'Empty Bottle';
    wsData.push([
      formatDate(inv.date),
      inv.invoiceNumber,
      isEB ? 'Empty Bottle' : 'Refill',
      inv.items.map(i => `${i.qty}×${i.cylinderType}`).join(', '),
      formatCurrency(inv.totalAmount),
      formatCurrency(inv.paidAmount),
      formatCurrency(inv.totalAmount - (Number(inv.paidAmount) || 0)),
      inv.paymentStatus,
    ]);
  });
  const txnEndRow = wsData.length - 1;

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 28 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ];

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: colCount - 1 } },
    { s: { r: summaryStartRow - 1, c: 0 }, e: { r: summaryStartRow - 1, c: colCount - 1 } },
    { s: { r: txnHeaderRow - 1, c: 0 }, e: { r: txnHeaderRow - 1, c: colCount - 1 } },
  ];

  // Style title
  styleRow(ws, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws, 1, 0, colCount - 1, STYLES.subtitle);

  // Customer details section
  styleRow(ws, 3, 0, colCount - 1, STYLES.section);
  for (let r = 4; r <= 6; r++) {
    styleCell(ws, XLSX.utils.encode_cell({ r, c: 0 }), STYLES.bold);
    styleCell(ws, XLSX.utils.encode_cell({ r, c: 1 }), STYLES.normal);
  }

  // Pricing section
  styleRow(ws, 8, 0, colCount - 1, STYLES.section);
  styleRow(ws, 9, 0, 4, STYLES.header);
  const pricingColStyles = ['bold', 'right', 'right', 'right', 'center'];
  styleDataRows(ws, pricingStartRow, pricingEndRow, 5, pricingColStyles);

  // Financial summary section
  styleRow(ws, summaryStartRow - 1, 0, colCount - 1, STYLES.section);
  for (let r = summaryStartRow; r < summaryStartRow + 4; r++) {
    styleCell(ws, XLSX.utils.encode_cell({ r, c: 0 }), STYLES.bold);
    const valRef = XLSX.utils.encode_cell({ r, c: 1 });
    if (r === summaryStartRow + 2) {
      // Balance due
      styleCell(ws, valRef, totalDue > 0 ? STYLES.danger : STYLES.success);
    } else {
      styleCell(ws, valRef, STYLES.currency);
    }
  }

  // Transaction history section
  styleRow(ws, txnHeaderRow - 1, 0, colCount - 1, STYLES.section);
  styleRow(ws, txnHeaderRow, 0, colCount - 1, STYLES.header);

  const txnColStyles = ['bold', 'center', 'center', 'left', 'right', 'right', 'right', 'center'];
  styleDataRows(ws, txnStartRow, txnEndRow, colCount, txnColStyles);

  // Style payment status cells in transactions
  for (let r = txnStartRow; r <= txnEndRow; r++) {
    const statusRef = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws[statusRef]) {
      const val = String(ws[statusRef].v || '').toLowerCase();
      if (val === 'paid' || val === 'full') {
        ws[statusRef].s = { ...STYLES.normalCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } };
      } else if (val === 'unpaid' || val === 'pending') {
        ws[statusRef].s = { ...STYLES.normalCenter, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } };
      } else if (val === 'partial') {
        ws[statusRef].s = STYLES.warningCell;
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customer Statement');
  saveWorkbook(wb, `Statement-${customer.name.replace(/\s+/g, '-')}.xlsx`);
}
