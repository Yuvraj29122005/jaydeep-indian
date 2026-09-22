import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportInvoiceExcel(invoice) {
  const isEB = invoice.invoiceType === 'Empty Bottle';
  const ws_data = [
    ['JAYDEEP INDIAN GAS AGENCY'],
    ['Invoice Type:', isEB ? 'Empty Bottle Collection Invoice' : 'Standard Refill Invoice'],
    ['Invoice Number:', invoice.invoiceNumber],
    ['Date:', invoice.date],
    ['Customer:', invoice.customerName],
    ['Phone:', invoice.customerPhone],
    ['Address:', invoice.customerAddress],
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
    ['', '', '', '', '', 'Balance Due:', invoice.totalAmount - invoice.paidAmount],
    [],
    ['Notes:', invoice.notes || '—'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEB ? 'Empty Bottle Receipt' : 'Invoice');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${invoice.invoiceNumber}.xlsx`);
}

export function exportAllInvoicesExcel(invoices) {
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
      inv.totalAmount - inv.paidAmount,
      inv.paymentMode,
      inv.deliveryStatus,
      inv.paymentStatus,
      inv.notes || '',
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-All-Invoices.xlsx');
}

export function exportCustomersExcel(customers, marketPrices) {
  const mkt = marketPrices || {};
  const headers = [
    'Customer ID', 'Name', 'Phone', 'Address', 'Type',
    '5kg Cust Price (Rs)', '5kg Market Price (Rs)', '5kg Discount (Rs)', '5kg Discount (%)',
    '19kg Cust Price (Rs)', '19kg Market Price (Rs)', '19kg Discount (Rs)', '19kg Discount (%)',
    '47.5kg Cust Price (Rs)', '47.5kg Market Price (Rs)', '47.5kg Discount (Rs)', '47.5kg Discount (%)',
    '5kg Bottles (Net)', '19kg Bottles (Net)', '47.5kg Bottles (Net)', 'Total Bottles (Net)',
    '5kg Empty w/ Cust', '19kg Empty w/ Cust', '47.5kg Empty w/ Cust', 'Total Empty Pending',
  ];

  const defaultBalance = () => ({
    '5kg': { filledGiven: 0, emptyCollected: 0 },
    '19kg': { filledGiven: 0, emptyCollected: 0 },
    '47.5kg': { filledGiven: 0, emptyCollected: 0 },
  });

  const defaultEmptyStock = () => ({
    '5kg': { withCustomer: 0, collected: 0 },
    '19kg': { withCustomer: 0, collected: 0 },
    '47.5kg': { withCustomer: 0, collected: 0 },
  });

  const cylTypes = ['5kg', '19kg', '47.5kg'];

  const rows = customers.map(c => {
    const bal = c.bottleBalance || defaultBalance();
    const es = c.emptyBottleStock || defaultEmptyStock();

    const getNet = (type) => {
      const b = bal[type] || { filledGiven: 0, emptyCollected: 0 };
      return b.filledGiven - b.emptyCollected;
    };
    const getEmptyPending = (type) => {
      const s = es[type] || { withCustomer: 0, collected: 0 };
      return Math.max(0, s.withCustomer - s.collected);
    };

    const b5 = getNet('5kg');
    const b19 = getNet('19kg');
    const b47 = getNet('47.5kg');
    const totalNet = b5 + b19 + b47;

    const e5 = getEmptyPending('5kg');
    const e19 = getEmptyPending('19kg');
    const e47 = getEmptyPending('47.5kg');
    const totalEmpty = e5 + e19 + e47;

    const priceDiscountCols = [];
    cylTypes.forEach(t => {
      const mktP = Number(mkt[t]) || 0;
      const custP = c.prices?.[t] !== undefined ? Number(c.prices[t]) : mktP;
      const discAmt = Math.max(0, mktP - custP);
      const discPct = mktP > 0 ? ((discAmt / mktP) * 100).toFixed(1) : '0.0';
      priceDiscountCols.push(custP, mktP, discAmt, `${discPct}%`);
    });

    return [
      c.id, c.name, c.phone, c.address, c.type,
      ...priceDiscountCols,
      b5, b19, b47, totalNet,
      e5, e19, e47, totalEmpty,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  // Add Market Prices summary sheet
  const marketSheet = [
    ['JAYDEEP INDIAN GAS AGENCY — Current Market Prices'],
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
  saveAs(blob, 'JIG-Customers.xlsx');
}

export function exportStockExcel(stock) {
  const headers = ['Cylinder Type', 'Filled Bottles', 'Empty Bottles', 'Total', 'Fill Rate (%)'];
  const rows = stock.map(s => {
    const total = s.filledCount + s.emptyCount;
    const fillRate = total > 0 ? ((s.filledCount / total) * 100).toFixed(1) : '0.0';
    return [s.cylinderType, s.filledCount, s.emptyCount, total, `${fillRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Stock-Report.xlsx');
}

export function exportDailyReportExcel(data) {
  const headers = ['Date', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)', 'Collection Rate (%)'];
  const rows = data.map(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    return [d.date, d.totalInvoices, d.revenue, d.collected, d.outstanding, `${collRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Daily-Report.xlsx');
}

export function exportMonthlyReportExcel(data) {
  const headers = ['Month', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)', 'Collection Rate (%)'];
  const rows = data.map(d => {
    const collRate = d.revenue > 0 ? ((d.collected / d.revenue) * 100).toFixed(1) : '0.0';
    return [d.month, d.totalInvoices, d.revenue, d.collected, d.outstanding, `${collRate}%`];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Monthly-Report.xlsx');
}

export function exportCustomerReportExcel(customer, invoices, marketPrices) {
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = totalBusiness - totalPaid;

  const summaryData = [
    ['JAYDEEP INDIAN GAS AGENCY - CUSTOMER STATEMENT'],
    [],
    ['Customer Name:', customer.name],
    ['Phone:', customer.phone],
    ['Address:', customer.address],
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
      inv.totalAmount - inv.paidAmount,
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
