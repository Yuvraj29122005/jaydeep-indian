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
  dangerCenter: { font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  successCenter: { font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  warningCenter: { font: { ...FONT.bold, color: { rgb: COLORS.warningFont } }, fill: { fgColor: { rgb: COLORS.warningBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
  sectionCenter: { font: FONT.section, fill: { fgColor: { rgb: COLORS.sectionBg } }, alignment: ALIGN_CENTER, border: BORDER_THIN },
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
    'Items Summary', 'Cylinder Types', 'Filled Sold',
    'Empty Collected', 'Empty Not Collected',
    'Total (₹)', 'Paid (₹)', 'Balance (₹)',
    'Payment Mode', 'Payment Status',
  ];
  const colCount = headers.length;

  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — ALL INVOICES & BOTTLE AUDIT REPORT`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Invoices: ${invoices.length}`],
    [],
    headers,
  ];

  const dataStartRow = wsData.length;
  let grandTotal = 0, grandPaid = 0;
  let grandFilledSold = 0, grandEmptyCollected = 0, grandEmptyNotCollected = 0;

  invoices.forEach(inv => {
    const isEB = inv.invoiceType === 'Empty Bottle';
    const cylTypes = [...new Set(inv.items.map(i => i.cylinderType))].join(', ');
    const balance = inv.totalAmount - (Number(inv.paidAmount) || 0);
    grandTotal += inv.totalAmount;
    grandPaid += Number(inv.paidAmount) || 0;

    const filledSold = isEB ? 0 : inv.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const emptyCollected = isEB
      ? inv.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)
      : inv.items.reduce((sum, i) => sum + (i.emptyCount !== undefined ? Number(i.emptyCount) : (i.emptyCollected ? Number(i.qty) : 0)), 0);
    const emptyNotCollected = isEB
      ? 0
      : inv.items.reduce((sum, i) => {
          const coll = i.emptyCount !== undefined ? Number(i.emptyCount) : (i.emptyCollected ? Number(i.qty) : 0);
          return sum + Math.max(0, (Number(i.qty) || 0) - coll);
        }, 0);

    grandFilledSold += filledSold;
    grandEmptyCollected += emptyCollected;
    grandEmptyNotCollected += emptyNotCollected;

    wsData.push([
      inv.invoiceNumber,
      isEB ? 'Empty Bottle' : 'Refill',
      formatDate(inv.date),
      inv.customerName,
      inv.items.map(i => `${i.qty}×${i.cylinderType}`).join(', '),
      cylTypes,
      filledSold,
      emptyCollected,
      emptyNotCollected,
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
    '', '', '', '', '', 'GRAND TOTAL',
    grandFilledSold, grandEmptyCollected, grandEmptyNotCollected,
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
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 28 }, { wch: 16 }, { wch: 12 },
    { wch: 16 }, { wch: 20 },
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
  const colStyles = ['bold', 'center', 'center', 'left', 'left', 'center', 'center', 'center', 'center', 'right', 'right', 'right', 'center', 'center'];
  styleDataRows(ws, dataStartRow, dataEndRow, colCount, colStyles);

  // Conditional styles for empty bottle and payment cells
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const isAlt = (r - dataStartRow) % 2 === 1;

    // Highlight uncollected empty bottles
    const emptyNotCollRef = XLSX.utils.encode_cell({ r, c: 8 });
    if (ws[emptyNotCollRef]) {
      const val = Number(ws[emptyNotCollRef].v) || 0;
      if (val > 0) {
        ws[emptyNotCollRef].s = {
          font: FONT.danger,
          fill: { fgColor: { rgb: COLORS.dangerBg } },
          alignment: ALIGN_CENTER,
          border: BORDER_THIN,
        };
      }
    }

    // Highlight empty collected
    const emptyCollRef = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws[emptyCollRef]) {
      const val = Number(ws[emptyCollRef].v) || 0;
      if (val > 0) {
        ws[emptyCollRef].s = {
          font: FONT.success,
          fill: { fgColor: { rgb: COLORS.successBg } },
          alignment: ALIGN_CENTER,
          border: BORDER_THIN,
        };
      }
    }

    // Payment status styling
    const statusRef = XLSX.utils.encode_cell({ r, c: 13 });
    if (ws[statusRef]) {
      const val = String(ws[statusRef].v || '').toLowerCase();
      if (val === 'paid' || val === 'full') {
        ws[statusRef].s = isAlt
          ? { ...STYLES.altRowCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } }
          : { ...STYLES.normalCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } };
      } else if (val === 'unpaid' || val === 'pending') {
        ws[statusRef].s = isAlt
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


// ═══════════════════════════════════════════════════════════════
// 8. DASHBOARD MASTER REPORT & FULL OPERATIONS SUMMARY
// ═══════════════════════════════════════════════════════════════

export function exportDashboardReportExcel(optionsOrDayInvoices, customSettings = null, stock = null, customers = null, selectedDate = null, allInvoices = null, monthlySalesData = null) {
  let dayInvoices = [];
  let fullInvoices = [];
  let customSettingsObj = null;
  let stockData = [];
  let customerList = [];
  let reportDateStr = null;
  let monthlyData = [];

  if (optionsOrDayInvoices && typeof optionsOrDayInvoices === 'object' && !Array.isArray(optionsOrDayInvoices)) {
    dayInvoices = optionsOrDayInvoices.dayInvoices || [];
    fullInvoices = optionsOrDayInvoices.invoices || optionsOrDayInvoices.allInvoices || dayInvoices;
    customSettingsObj = optionsOrDayInvoices.agencySettings || optionsOrDayInvoices.customSettings;
    stockData = optionsOrDayInvoices.stock || [];
    customerList = optionsOrDayInvoices.customers || [];
    reportDateStr = optionsOrDayInvoices.selectedDate || optionsOrDayInvoices.reportDate;
    monthlyData = optionsOrDayInvoices.monthlySalesData || [];
  } else {
    dayInvoices = optionsOrDayInvoices || [];
    customSettingsObj = customSettings;
    stockData = stock || [];
    customerList = customers || [];
    reportDateStr = selectedDate;
    fullInvoices = allInvoices || dayInvoices;
    monthlyData = monthlySalesData || [];
  }

  const settings = getActiveAgencySettings(customSettingsObj);
  const dateKey = reportDateStr || (dayInvoices[0] ? dayInvoices[0].date : new Date().toISOString().slice(0, 10));
  const formattedDate = formatDate(dateKey);

  // 1. Lifetime Agency Financials
  const totalLifetimeRevenue = fullInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const totalLifetimePaid = fullInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalLifetimeOutstanding = Math.max(0, totalLifetimeRevenue - totalLifetimePaid);
  const lifetimeCollectionRate = totalLifetimeRevenue > 0 ? ((totalLifetimePaid / totalLifetimeRevenue) * 100).toFixed(1) : '100.0';

  // 2. Selected Day Financials
  const dayRevenue = dayInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const dayPaid = dayInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const dayOutstanding = Math.max(0, dayRevenue - dayPaid);
  const dayPaymentRate = dayRevenue > 0 ? ((dayPaid / dayRevenue) * 100).toFixed(1) : '100.0';

  // 3. Warehouse Stock Inventory Metrics
  const totalFilledStock = stockData.reduce((s, st) => s + (Number(st.filledCount) || 0), 0);
  const totalEmptyStock = stockData.reduce((s, st) => s + (Number(st.emptyCount) || 0), 0);
  const grandTotalWarehouseStock = totalFilledStock + totalEmptyStock;
  const warehouseFillRatio = grandTotalWarehouseStock > 0 ? ((totalFilledStock / grandTotalWarehouseStock) * 100).toFixed(1) : '0.0';

  // 4. Day Cylinder Movements & Empty Bottle Audit
  let dayFilledSold = 0;
  let dayEmptyCollected = 0;
  let dayEmptyNotCollected = 0;

  const cylDayBreakdown = {
    '5kg': { filledSold: 0, emptyCollected: 0, emptyNotCollected: 0 },
    '19kg': { filledSold: 0, emptyCollected: 0, emptyNotCollected: 0 },
    '47.5kg': { filledSold: 0, emptyCollected: 0, emptyNotCollected: 0 },
  };

  dayInvoices.forEach(inv => {
    const isEB = inv.invoiceType === 'Empty Bottle';
    inv.items.forEach(i => {
      const type = i.cylinderType || '19kg';
      const qty = Number(i.qty) || 0;
      if (!cylDayBreakdown[type]) cylDayBreakdown[type] = { filledSold: 0, emptyCollected: 0, emptyNotCollected: 0 };

      if (isEB) {
        dayEmptyCollected += qty;
        cylDayBreakdown[type].emptyCollected += qty;
      } else {
        const coll = i.emptyCount !== undefined ? Number(i.emptyCount) : (i.emptyCollected ? qty : 0);
        const notColl = Math.max(0, qty - coll);
        dayFilledSold += qty;
        dayEmptyCollected += coll;
        dayEmptyNotCollected += notColl;

        cylDayBreakdown[type].filledSold += qty;
        cylDayBreakdown[type].emptyCollected += coll;
        cylDayBreakdown[type].emptyNotCollected += notColl;
      }
    });
  });

  const dayEmptyReturnRate = dayFilledSold > 0 ? ((dayEmptyCollected / dayFilledSold) * 100).toFixed(1) : (dayEmptyCollected > 0 ? '100.0' : '0.0');

  // 5. Customer Segmentation & Outstanding Empty Bottle Audit
  let totalCustPending5kg = 0;
  let totalCustPending19kg = 0;
  let totalCustPending47kg = 0;
  const customersWithPendingBottles = [];
  const customerTypeCounts = { Domestic: 0, Commercial: 0, Hotel: 0, Industrial: 0, Other: 0 };

  customerList.forEach(c => {
    const t = c.type || 'Domestic';
    if (customerTypeCounts[t] !== undefined) customerTypeCounts[t]++;
    else customerTypeCounts.Other++;

    const stockObj = c.emptyBottleStock || {};
    const net5 = Math.max(0, (Number(stockObj['5kg']?.withCustomer) || 0) - (Number(stockObj['5kg']?.collected) || 0));
    const net19 = Math.max(0, (Number(stockObj['19kg']?.withCustomer) || 0) - (Number(stockObj['19kg']?.collected) || 0));
    const net47 = Math.max(0, (Number(stockObj['47.5kg']?.withCustomer) || 0) - (Number(stockObj['47.5kg']?.collected) || 0));
    const totalPending = net5 + net19 + net47;

    totalCustPending5kg += net5;
    totalCustPending19kg += net19;
    totalCustPending47kg += net47;

    const custInvs = fullInvoices.filter(i => i.customerId === c.id);
    const custDue = custInvs.reduce((s, i) => s + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.paidAmount) || 0)), 0);

    if (totalPending > 0 || custDue > 0) {
      customersWithPendingBottles.push({
        name: c.name,
        phone: c.phone || '—',
        type: c.type || 'Domestic',
        address: c.address || '—',
        net5,
        net19,
        net47,
        totalPending,
        totalDue: custDue,
      });
    }
  });

  const grandAgencyPendingEmpty = totalCustPending5kg + totalCustPending19kg + totalCustPending47kg;

  // 6. Monthly Data Computation
  let computedMonthly = monthlyData;
  if (!computedMonthly || computedMonthly.length === 0) {
    const monthMap = {};
    fullInvoices.forEach(inv => {
      const month = new Date(inv.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[month]) monthMap[month] = { month, '5kg': 0, '19kg': 0, '47.5kg': 0, revenue: 0, count: 0 };
      monthMap[month].revenue += Number(inv.totalAmount) || 0;
      monthMap[month].count++;
      inv.items.forEach(item => {
        const type = item.cylinderType;
        if (monthMap[month][type] !== undefined) {
          monthMap[month][type] += Number(item.qty) || 0;
        }
      });
    });
    computedMonthly = Object.values(monthMap);
  }

  const colCount = 13;

  // ─────────────────────────────────────────────────────────────
  // SHEET 1: DASHBOARD MASTER SUMMARY
  // ─────────────────────────────────────────────────────────────
  const wsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()}`],
    [`${settings.tagline || 'Authorized Indane LPG Distributor'}  |  GSTIN: ${settings.gstin || '—'}  |  PAN: ${settings.panNumber || '—'}`],
    [`FULL AGENCY DASHBOARD AUDIT & OPERATIONS SUMMARY REPORT`],
    [`Generated On: ${new Date().toLocaleString('en-IN')}  |  Selected Day: ${formattedDate}  |  Agency: ${settings.agencyName || 'Jaydeep Indian Gas Agency'}`],
    [],
  ];

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } },
  ];

  // ── BLOCK 1: OVERALL AGENCY LIFETIME KPI DASHBOARD ──
  const sec1HeaderRow = wsData.length;
  wsData.push(['1. OVERALL AGENCY LIFETIME KPI DASHBOARD (STAT CARDS SUMMARY)']);
  merges.push({ s: { r: sec1HeaderRow, c: 0 }, e: { r: sec1HeaderRow, c: colCount - 1 } });

  wsData.push(['Dashboard Metric (Stat Card)', 'Current Value / Figure', 'Audit Assessment & Status']);
  const kpiHeaderRow = wsData.length - 1;
  const kpiStartRow = wsData.length;

  wsData.push(['Total Billed Revenue (All Invoices)', formatCurrency(totalLifetimeRevenue), `Across ${fullInvoices.length} total billed invoices`]);
  wsData.push(['Total Realized Payments Collected', formatCurrency(totalLifetimePaid), `${lifetimeCollectionRate}% realization of total billed revenue`]);
  wsData.push(['Total Outstanding Balance Due', formatCurrency(totalLifetimeOutstanding), totalLifetimeOutstanding > 0 ? '⚠️ Outstanding payment collection due from customers' : '✅ 100% Cleared / No Pending Payments']);
  wsData.push(['Total Registered Consumers', `${customerList.length} Customers`, 'Registered active domestic & commercial consumers']);
  wsData.push(['Total Agency Cylinders (Warehouse)', `${grandTotalWarehouseStock} Cylinders`, `${totalFilledStock} Filled | ${totalEmptyStock} Empty in godown`]);
  wsData.push(['Warehouse Filled Stock', `${totalFilledStock} Cylinders`, totalFilledStock < 30 ? '⚠️ Low stock — refill order recommended' : '🟢 Ready for delivery in godown']);
  wsData.push(['Warehouse Empty Cylinders', `${totalEmptyStock} Cylinders`, 'Awaiting dispatch to LPG bottling plant']);
  wsData.push(['Empty Cylinders in Market (With Customers)', `${grandAgencyPendingEmpty} Cylinders`, grandAgencyPendingEmpty > 0 ? `⚠️ ${grandAgencyPendingEmpty} Empty bottles pending collection across ${customersWithPendingBottles.length} customers` : '✅ All empty bottles collected from market']);
  const kpiEndRow = wsData.length - 1;
  wsData.push([]);

  // ── BLOCK 2: SELECTED DAY OPERATIONS SNAPSHOT ──
  const sec2HeaderRow = wsData.length;
  wsData.push([`2. SELECTED DAY OPERATIONS SNAPSHOT — ${formattedDate.toUpperCase()}`]);
  merges.push({ s: { r: sec2HeaderRow, c: 0 }, e: { r: sec2HeaderRow, c: colCount - 1 } });

  wsData.push(['Day Metric Description', 'Day Value / Count', 'Day Performance & Audit Note']);
  const dayHeaderRow = wsData.length - 1;
  const dayStartRow = wsData.length;

  wsData.push(['Day Snapshot Date', formattedDate, 'Selected day for operational analysis']);
  wsData.push(['Day Invoices Billed', `${dayInvoices.length} Invoices`, dayInvoices.length > 0 ? 'Active billing transactions recorded' : 'No invoices billed on this date']);
  wsData.push(['Day Sales Revenue', formatCurrency(dayRevenue), 'Gross revenue billed today']);
  wsData.push(['Day Payments Collected', formatCurrency(dayPaid), 'Cash, UPI & Bank collections received today']);
  wsData.push(['Day Outstanding Due', formatCurrency(dayOutstanding), dayOutstanding > 0 ? '⚠️ Pending payments due from today\'s deliveries' : '✅ 100% Collected']);
  wsData.push(['Day Filled Cylinders Sold', `${dayFilledSold} Cylinders`, 'Filled cylinders delivered to consumers today']);
  wsData.push(['Day Empty Bottles Collected', `${dayEmptyCollected} Cylinders`, '🫙 Returned empty bottles collected today']);
  wsData.push(['Day Empty Bottles NOT Collected (Pending)', `${dayEmptyNotCollected} Cylinders`, dayEmptyNotCollected > 0 ? `⚠️ ${dayEmptyNotCollected} Empty bottles pending pickup from today's deliveries` : '✅ 100% Empties retrieved today']);
  wsData.push(['Day Empty Return Ratio', `${dayEmptyReturnRate}%`, 'Ratio of empties collected vs filled delivered today']);
  const dayEndRow = wsData.length - 1;
  wsData.push([]);

  // ── BLOCK 3: CYLINDER MOVEMENT & BOTTLE AUDIT TABLE ──
  const sec3HeaderRow = wsData.length;
  wsData.push(['3. CYLINDER MOVEMENT & EMPTY BOTTLE RECONCILIATION (BY CYLINDER TYPE)']);
  merges.push({ s: { r: sec3HeaderRow, c: 0 }, e: { r: sec3HeaderRow, c: colCount - 1 } });

  const cylHeaders = [
    'Cylinder Type',
    'Today Filled Sold',
    'Today Empty Collected',
    'Today Empty NOT Collected',
    'Today Return %',
    'Market Empties Pending (All Customers)',
    'Audit Status & Action Note'
  ];
  wsData.push(cylHeaders);
  const cylHeaderRow = wsData.length - 1;
  const cylStartRow = wsData.length;

  const marketPendingByType = { '5kg': totalCustPending5kg, '19kg': totalCustPending19kg, '47.5kg': totalCustPending47kg };

  ['5kg', '19kg', '47.5kg'].forEach(type => {
    const d = cylDayBreakdown[type];
    const rate = d.filledSold > 0 ? ((d.emptyCollected / d.filledSold) * 100).toFixed(1) : (d.emptyCollected > 0 ? '100.0' : '0.0');
    const mktPending = marketPendingByType[type] || 0;
    let status = 'Normal';
    if (d.emptyNotCollected > 0) status = `⚠️ ${d.emptyNotCollected} Empties pending today (${mktPending} in market)`;
    else if (d.filledSold > 0) status = `✅ All today's empties retrieved (${mktPending} in market)`;
    else status = `No sales today (${mktPending} in market)`;

    wsData.push([
      `${type} Cylinder`,
      d.filledSold,
      d.emptyCollected,
      d.emptyNotCollected,
      `${rate}%`,
      mktPending,
      status
    ]);
  });

  wsData.push([
    'TOTAL MOVEMENT',
    dayFilledSold,
    dayEmptyCollected,
    dayEmptyNotCollected,
    `${dayEmptyReturnRate}%`,
    grandAgencyPendingEmpty,
    dayEmptyNotCollected > 0 ? `⚠️ ${dayEmptyNotCollected} Pending Today | ${grandAgencyPendingEmpty} Market Total` : `✅ All Retrieved Today | ${grandAgencyPendingEmpty} Market Total`
  ]);
  const cylEndRow = wsData.length - 1;
  wsData.push([]);

  // ── BLOCK 4: CURRENT WAREHOUSE STOCK INVENTORY ──
  let stockStartRow = -1;
  let stockEndRow = -1;
  let sHeaderRow = -1;
  if (stockData && stockData.length > 0) {
    const sec4HeaderRow = wsData.length;
    wsData.push(['4. CURRENT GODOWN STOCK INVENTORY (PHYSICAL WAREHOUSE COUNT)']);
    merges.push({ s: { r: sec4HeaderRow, c: 0 }, e: { r: sec4HeaderRow, c: colCount - 1 } });

    const stockHeaders = ['Cylinder Type', 'Filled in Godown', 'Empty in Godown', 'Total Warehouse Stock', 'Fill Ratio (%)', 'Stock Status & Recommendations'];
    wsData.push(stockHeaders);
    sHeaderRow = wsData.length - 1;
    stockStartRow = wsData.length;

    stockData.forEach(s => {
      const f = Number(s.filledCount) || 0;
      const e = Number(s.emptyCount) || 0;
      const tot = f + e;
      const ratio = tot > 0 ? ((f / tot) * 100).toFixed(1) : '0.0';
      let status = '🟢 Healthy Stock Level';
      if (f === 0) status = '🔴 Out of Stock — Urgent Refill Required';
      else if (f < 10) status = '⚠️ Low Stock — Place Refill Order';

      wsData.push([
        `${s.cylinderType} Cylinder`,
        f,
        e,
        tot,
        `${ratio}%`,
        status
      ]);
    });

    wsData.push([
      'TOTAL GODOWN STOCK',
      totalFilledStock,
      totalEmptyStock,
      grandTotalWarehouseStock,
      `${warehouseFillRatio}%`,
      totalFilledStock < 25 ? '⚠️ Agency-wide refill order recommended' : '🟢 Normal Agency Operations'
    ]);
    stockEndRow = wsData.length - 1;
    wsData.push([]);
  }

  // ── BLOCK 5: MONTHLY SALES & CYLINDER VOLUME TREND ──
  let monthlyStartRow = -1;
  let monthlyEndRow = -1;
  let mHeaderRow = -1;
  if (computedMonthly && computedMonthly.length > 0) {
    const sec5HeaderRow = wsData.length;
    wsData.push(['5. MONTHLY SALES VOLUME & REVENUE PERFORMANCE (FROM DASHBOARD CHARTS)']);
    merges.push({ s: { r: sec5HeaderRow, c: 0 }, e: { r: sec5HeaderRow, c: colCount - 1 } });

    const mHeaders = ['Billing Month', '5kg Cylinders', '19kg Cylinders', '47.5kg Cylinders', 'Total Cylinders Volume', 'Monthly Sales Revenue (₹)', 'Performance Trend'];
    wsData.push(mHeaders);
    mHeaderRow = wsData.length - 1;
    monthlyStartRow = wsData.length;

    let totM5 = 0, totM19 = 0, totM47 = 0, totMRev = 0;
    computedMonthly.forEach(m => {
      const q5 = Number(m['5kg']) || 0;
      const q19 = Number(m['19kg']) || 0;
      const q47 = Number(m['47.5kg']) || 0;
      const totVol = q5 + q19 + q47;
      const rev = Number(m.revenue) || 0;

      totM5 += q5;
      totM19 += q19;
      totM47 += q47;
      totMRev += rev;

      wsData.push([
        m.month,
        q5,
        q19,
        q47,
        totVol,
        formatCurrency(rev),
        rev > 50000 ? '🟢 Strong Month' : '🟡 Regular Sales'
      ]);
    });

    const totMVol = totM5 + totM19 + totM47;
    wsData.push([
      'TOTAL MONTHLY VOLUME',
      totM5,
      totM19,
      totM47,
      totMVol,
      formatCurrency(totMRev),
      'Aggregate Volume Recorded'
    ]);
    monthlyEndRow = wsData.length - 1;
    wsData.push([]);
  }

  // ── BLOCK 6: CUSTOMER SEGMENTATION BREAKDOWN ──
  let custSegStartRow = -1;
  let custSegEndRow = -1;
  let csHeaderRow = -1;
  if (customerList.length > 0) {
    const sec6HeaderRow = wsData.length;
    wsData.push(['6. REGISTERED CUSTOMER BASE SEGMENTATION']);
    merges.push({ s: { r: sec6HeaderRow, c: 0 }, e: { r: sec6HeaderRow, c: colCount - 1 } });

    const csHeaders = ['Customer Category / Segment', 'Total Accounts', 'Share of Total Base (%)', 'Segment Description'];
    wsData.push(csHeaders);
    csHeaderRow = wsData.length - 1;
    custSegStartRow = wsData.length;

    ['Domestic', 'Commercial', 'Hotel', 'Industrial'].forEach(cat => {
      const cnt = customerTypeCounts[cat] || 0;
      const pct = customerList.length > 0 ? ((cnt / customerList.length) * 100).toFixed(1) : '0.0';
      wsData.push([
        `${cat} Consumers`,
        cnt,
        `${pct}%`,
        `${cat} LPG consumers registered under ${settings.agencyName || 'agency'}`
      ]);
    });

    wsData.push([
      'TOTAL CUSTOMERS',
      customerList.length,
      '100.0%',
      'Complete registered consumer directory'
    ]);
    custSegEndRow = wsData.length - 1;
    wsData.push([]);
  }

  // ── BLOCK 7: AUDIT VERIFICATION FOOTER ──
  const sec7HeaderRow = wsData.length;
  wsData.push(['7. OFFICIAL AUDIT VERIFICATION & SIGN-OFF']);
  merges.push({ s: { r: sec7HeaderRow, c: 0 }, e: { r: sec7HeaderRow, c: colCount - 1 } });
  wsData.push([`Agency: ${settings.agencyName || 'Jaydeep Indian Gas Agency'}  |  Address: ${settings.address || '—'}  |  Phone: ${settings.phone || '—'}`]);
  merges.push({ s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: colCount - 1 } });
  wsData.push(['Verified By (Manager / Owner): ___________________________      Agency Seal / Stamp: [                      ]      Date: ' + new Date().toLocaleDateString('en-IN')]);
  merges.push({ s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: colCount - 1 } });

  // Create Sheet 1
  const ws1 = XLSX.utils.aoa_to_sheet(wsData);
  ws1['!merges'] = merges;
  ws1['!cols'] = [
    { wch: 32 }, // Title / Metric
    { wch: 22 }, // Value / Count
    { wch: 22 }, // Status / Note
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
  ];

  // Header Title Styling
  styleRow(ws1, 0, 0, colCount - 1, STYLES.title);
  styleRow(ws1, 1, 0, colCount - 1, STYLES.subtitle);
  styleRow(ws1, 2, 0, colCount - 1, STYLES.title);
  styleRow(ws1, 3, 0, colCount - 1, STYLES.subtitle);

  // Section 1: KPI styling
  styleRow(ws1, sec1HeaderRow, 0, colCount - 1, STYLES.section);
  styleRow(ws1, kpiHeaderRow, 0, 2, STYLES.header);
  for (let r = kpiStartRow; r <= kpiEndRow; r++) {
    const isAlt = (r - kpiStartRow) % 2 === 1;
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 0 }), isAlt ? STYLES.altRowBold : STYLES.bold);
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), isAlt ? STYLES.altRowBold : STYLES.bold);
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 2 }), isAlt ? STYLES.altRow : STYLES.normal);

    if (r === kpiStartRow + 2) { // Outstanding
      styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), totalLifetimeOutstanding > 0 ? STYLES.danger : STYLES.success);
    }
    if (r === kpiStartRow + 7) { // Market Empties
      styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), grandAgencyPendingEmpty > 0 ? STYLES.dangerCenter : STYLES.successCenter);
    }
  }

  // Section 2: Day Snapshot styling
  styleRow(ws1, sec2HeaderRow, 0, colCount - 1, STYLES.section);
  styleRow(ws1, dayHeaderRow, 0, 2, STYLES.header);
  for (let r = dayStartRow; r <= dayEndRow; r++) {
    const isAlt = (r - dayStartRow) % 2 === 1;
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 0 }), isAlt ? STYLES.altRowBold : STYLES.bold);
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), isAlt ? STYLES.altRowBold : STYLES.bold);
    styleCell(ws1, XLSX.utils.encode_cell({ r, c: 2 }), isAlt ? STYLES.altRow : STYLES.normal);

    if (r === dayStartRow + 4) { // Day Outstanding
      styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), dayOutstanding > 0 ? STYLES.danger : STYLES.success);
    }
    if (r === dayStartRow + 6) { // Day Empty Collected
      styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), STYLES.successCenter);
    }
    if (r === dayStartRow + 7) { // Day Empty NOT Collected
      styleCell(ws1, XLSX.utils.encode_cell({ r, c: 1 }), dayEmptyNotCollected > 0 ? STYLES.dangerCenter : STYLES.successCenter);
    }
  }

  // Section 3: Cylinder Movement styling
  styleRow(ws1, sec3HeaderRow, 0, colCount - 1, STYLES.section);
  styleRow(ws1, cylHeaderRow, 0, 6, STYLES.header);
  const cylColStyles = ['bold', 'center', 'center', 'center', 'center', 'center', 'left'];
  styleDataRows(ws1, cylStartRow, cylEndRow - 1, 7, cylColStyles);
  styleRow(ws1, cylEndRow, 0, 6, STYLES.totalLabel);

  for (let r = cylStartRow; r <= cylEndRow; r++) {
    const notCollRef = XLSX.utils.encode_cell({ r, c: 3 });
    if (ws1[notCollRef] && Number(ws1[notCollRef].v) > 0) {
      ws1[notCollRef].s = STYLES.dangerCenter;
    }
    const collRef = XLSX.utils.encode_cell({ r, c: 2 });
    if (ws1[collRef] && Number(ws1[collRef].v) > 0 && r !== cylEndRow) {
      ws1[collRef].s = STYLES.successCenter;
    }
  }

  // Section 4: Stock styling
  if (stockStartRow > 0) {
    styleRow(ws1, sec4HeaderRow, 0, colCount - 1, STYLES.section);
    styleRow(ws1, sHeaderRow, 0, 5, STYLES.header);
    const stockColStyles = ['bold', 'center', 'center', 'center', 'center', 'left'];
    styleDataRows(ws1, stockStartRow, stockEndRow - 1, 6, stockColStyles);
    styleRow(ws1, stockEndRow, 0, 5, STYLES.totalLabel);
  }

  // Section 5: Monthly styling
  if (monthlyStartRow > 0) {
    styleRow(ws1, sec5HeaderRow, 0, colCount - 1, STYLES.section);
    styleRow(ws1, mHeaderRow, 0, 6, STYLES.header);
    const mColStyles = ['bold', 'center', 'center', 'center', 'center', 'right', 'left'];
    styleDataRows(ws1, monthlyStartRow, monthlyEndRow - 1, 7, mColStyles);
    styleRow(ws1, monthlyEndRow, 0, 6, STYLES.totalLabel);
  }

  // Section 6: Customer Segmentation styling
  if (custSegStartRow > 0) {
    styleRow(ws1, sec6HeaderRow, 0, colCount - 1, STYLES.section);
    styleRow(ws1, csHeaderRow, 0, 3, STYLES.header);
    const csColStyles = ['bold', 'center', 'center', 'left'];
    styleDataRows(ws1, custSegStartRow, custSegEndRow - 1, 4, csColStyles);
    styleRow(ws1, custSegEndRow, 0, 3, STYLES.totalLabel);
  }

  // Section 7: Footer styling
  styleRow(ws1, sec7HeaderRow, 0, colCount - 1, STYLES.section);
  styleRow(ws1, sec7HeaderRow + 1, 0, colCount - 1, STYLES.footer);
  styleRow(ws1, sec7HeaderRow + 2, 0, colCount - 1, STYLES.footer);

  // Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Dashboard Master');

  // ─────────────────────────────────────────────────────────────
  // SHEET 2: INVOICES & DELIVERIES DETAIL REGISTER
  // ─────────────────────────────────────────────────────────────
  const invWsData = [
    [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()}`],
    [`DELIVERY & INVOICE AUDIT REGISTER — ${formattedDate.toUpperCase()}`],
    [`Generated: ${new Date().toLocaleString('en-IN')}  |  Day Revenue: ${formatCurrency(dayRevenue)}  |  Total Invoices: ${dayInvoices.length}`],
    [],
  ];

  const invHeaders = [
    'Invoice No', 'Type', 'Date', 'Customer Name', 'Items Summary', 'Cylinder Types',
    'Filled Sold', 'Empty Collected', 'Empty Not Collected',
    'Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Payment Mode', 'Payment Status'
  ];
  invWsData.push(invHeaders);
  const invStartRow = invWsData.length;

  if (dayInvoices.length === 0) {
    invWsData.push(['No transactions recorded for this date', '', '', '', '', '', 0, 0, 0, '₹0', '₹0', '₹0', '—', '—']);
  } else {
    dayInvoices.forEach(inv => {
      const isEB = inv.invoiceType === 'Empty Bottle';
      const cylTypes = [...new Set(inv.items.map(i => i.cylinderType))].join(', ');
      const balance = inv.totalAmount - (Number(inv.paidAmount) || 0);

      const filledSold = isEB ? 0 : inv.items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
      const emptyCollected = isEB
        ? inv.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)
        : inv.items.reduce((s, i) => s + (i.emptyCount !== undefined ? Number(i.emptyCount) : (i.emptyCollected ? Number(i.qty) : 0)), 0);
      const emptyNotCollected = isEB
        ? 0
        : inv.items.reduce((s, i) => {
            const coll = i.emptyCount !== undefined ? Number(i.emptyCount) : (i.emptyCollected ? Number(i.qty) : 0);
            return s + Math.max(0, (Number(i.qty) || 0) - coll);
          }, 0);

      invWsData.push([
        inv.invoiceNumber,
        isEB ? 'Empty Bottle' : 'Refill',
        formatDate(inv.date),
        inv.customerName,
        inv.items.map(i => `${i.qty}×${i.cylinderType}`).join(', '),
        cylTypes,
        filledSold,
        emptyCollected,
        emptyNotCollected,
        formatCurrency(inv.totalAmount),
        formatCurrency(inv.paidAmount),
        formatCurrency(balance),
        inv.paymentMode,
        inv.paymentStatus
      ]);
    });
  }
  const invEndRow = invWsData.length - 1;

  invWsData.push([
    '', '', '', '', 'GRAND TOTAL', '',
    dayFilledSold, dayEmptyCollected, dayEmptyNotCollected,
    formatCurrency(dayRevenue), formatCurrency(dayPaid), formatCurrency(dayOutstanding),
    '', ''
  ]);
  const invTotalRow = invWsData.length - 1;

  const ws2 = XLSX.utils.aoa_to_sheet(invWsData);
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 13 } },
  ];
  ws2['!cols'] = [
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 28 }, { wch: 16 }, { wch: 12 },
    { wch: 16 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }
  ];

  styleRow(ws2, 0, 0, 13, STYLES.title);
  styleRow(ws2, 1, 0, 13, STYLES.subtitle);
  styleRow(ws2, 2, 0, 13, STYLES.subtitle);
  styleRow(ws2, 4, 0, 13, STYLES.header);

  const invColStyles = ['bold', 'center', 'center', 'left', 'left', 'center', 'center', 'center', 'center', 'right', 'right', 'right', 'center', 'center'];
  styleDataRows(ws2, invStartRow, invEndRow, 14, invColStyles);

  for (let r = invStartRow; r <= invEndRow; r++) {
    const isAlt = (r - invStartRow) % 2 === 1;
    const notCollRef = XLSX.utils.encode_cell({ r, c: 8 });
    if (ws2[notCollRef] && Number(ws2[notCollRef].v) > 0) {
      ws2[notCollRef].s = STYLES.dangerCenter;
    }
    const collRef = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws2[collRef] && Number(ws2[collRef].v) > 0) {
      ws2[collRef].s = STYLES.successCenter;
    }
    const statusRef = XLSX.utils.encode_cell({ r, c: 13 });
    if (ws2[statusRef]) {
      const val = String(ws2[statusRef].v || '').toLowerCase();
      if (val === 'paid' || val === 'full') {
        ws2[statusRef].s = isAlt ? { ...STYLES.altRowCenter, font: FONT.success, fill: { fgColor: { rgb: COLORS.successBg } } } : STYLES.successCenter;
      } else if (val === 'unpaid' || val === 'pending') {
        ws2[statusRef].s = isAlt ? { ...STYLES.altRowCenter, font: FONT.danger, fill: { fgColor: { rgb: COLORS.dangerBg } } } : STYLES.dangerCenter;
      } else if (val === 'partial') {
        ws2[statusRef].s = STYLES.warningCell;
      }
    }
  }
  styleRow(ws2, invTotalRow, 0, 13, STYLES.totalLabel);

  XLSX.utils.book_append_sheet(wb, ws2, 'Day Invoices Register');

  // ─────────────────────────────────────────────────────────────
  // SHEET 3: CUSTOMER OUTSTANDING BOTTLES & PAYMENT DUES
  // ─────────────────────────────────────────────────────────────
  if (customersWithPendingBottles.length > 0) {
    const wsCustData = [
      [`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()}`],
      [`OUTSTANDING CUSTOMER EMPTY BOTTLES & PAYMENT DUES AUDIT REGISTER`],
      [`Generated: ${new Date().toLocaleString('en-IN')}  |  Customers with Dues: ${customersWithPendingBottles.length}  |  Market Pending Bottles: ${grandAgencyPendingEmpty}`],
      [],
      ['Sr No', 'Customer Name', 'Phone Number', 'Customer Type', 'Delivery Address', '5kg Empties', '19kg Empties', '47.5kg Empties', 'Total Pending Empties', 'Pending Payment Due (₹)', 'Action Required'],
    ];

    const cStartRow = wsCustData.length;
    customersWithPendingBottles.forEach((c, idx) => {
      wsCustData.push([
        idx + 1,
        c.name,
        c.phone,
        c.type,
        c.address,
        c.net5,
        c.net19,
        c.net47,
        c.totalPending,
        formatCurrency(c.totalDue),
        c.totalPending > 5 ? '🔴 Immediate Pickup' : c.totalDue > 0 ? '⚠️ Payment & Bottle Follow-up' : '🫙 Routine Collection'
      ]);
    });
    const cEndRow = wsCustData.length - 1;

    const totalCustDueSum = customersWithPendingBottles.reduce((s, c) => s + (c.totalDue || 0), 0);
    wsCustData.push([
      '', 'TOTAL OUTSTANDING DUES', '', '', '',
      totalCustPending5kg, totalCustPending19kg, totalCustPending47kg,
      grandAgencyPendingEmpty, formatCurrency(totalCustDueSum), 'Market Dues Total'
    ]);
    const cTotalRow = wsCustData.length - 1;

    const ws3 = XLSX.utils.aoa_to_sheet(wsCustData);
    ws3['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    ];
    ws3['!cols'] = [
      { wch: 8 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 28 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 26 }
    ];

    styleRow(ws3, 0, 0, 10, STYLES.title);
    styleRow(ws3, 1, 0, 10, STYLES.subtitle);
    styleRow(ws3, 2, 0, 10, STYLES.subtitle);
    styleRow(ws3, 4, 0, 10, STYLES.header);

    const cStyles = ['center', 'bold', 'center', 'center', 'left', 'center', 'center', 'center', 'center', 'right', 'left'];
    styleDataRows(ws3, cStartRow, cEndRow, 11, cStyles);

    for (let r = cStartRow; r <= cEndRow; r++) {
      const totRef = XLSX.utils.encode_cell({ r, c: 8 });
      if (ws3[totRef] && Number(ws3[totRef].v) > 0) {
        ws3[totRef].s = STYLES.dangerCenter;
      }
      const dueRef = XLSX.utils.encode_cell({ r, c: 9 });
      if (ws3[dueRef]) {
        const val = String(ws3[dueRef].v || '').replace(/[₹,]/g, '');
        if (Number(val) > 0) {
          ws3[dueRef].s = STYLES.danger;
        }
      }
    }
    styleRow(ws3, cTotalRow, 0, 10, STYLES.totalLabel);

    XLSX.utils.book_append_sheet(wb, ws3, 'Customer Bottle Dues');
  }

  saveWorkbook(wb, `${settings.invoicePrefix || 'JIG'}-Dashboard-Report-${dateKey}.xlsx`);
}

// Alias for backwards compatibility
export const exportDashboardDayReportExcel = exportDashboardReportExcel;

