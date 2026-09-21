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
      : ['Cylinder Type', 'Quantity (Filled)', 'Unit Price (Rs)', 'Amount (Rs)', 'Empty Collected'],
    ...invoice.items.map(item => [
      item.cylinderType,
      item.qty,
      item.unitPrice,
      (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
      isEB ? 'Collected' : (item.emptyCollected ? `Yes (${item.emptyCount || item.qty})` : 'No'),
    ]),
    [],
    ['', '', '', 'Total Amount:', invoice.totalAmount],
    ['', '', '', 'Amount Paid:', invoice.paidAmount],
    ['', '', '', 'Balance Due:', invoice.totalAmount - invoice.paidAmount],
    [],
    ['Notes:', invoice.notes || '—'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEB ? 'Empty Bottle Receipt' : 'Invoice');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${invoice.invoiceNumber}.xlsx`);
}

export function exportAllInvoicesExcel(invoices) {
  const headers = ['Invoice No', 'Type', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Total (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Payment Mode', 'Delivery Status', 'Payment Status', 'Notes'];

  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.invoiceType === 'Empty Bottle' ? 'Empty Bottle' : 'Refill',
    inv.date,
    inv.customerName,
    inv.customerPhone,
    inv.customerAddress,
    inv.items.map(i => `${i.qty}x${i.cylinderType}${inv.invoiceType === 'Empty Bottle' ? ' (Empty)' : ''}`).join(', '),
    inv.totalAmount,
    inv.paidAmount,
    inv.totalAmount - inv.paidAmount,
    inv.paymentMode,
    inv.deliveryStatus,
    inv.paymentStatus,
    inv.notes || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Invoices');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-All-Invoices.xlsx');
}

export function exportCustomersExcel(customers) {
  const headers = [
    'Customer ID', 'Name', 'Phone', 'Address', 'Type', 
    '5kg Price (Rs)', '19kg Price (Rs)', '47.5kg Price (Rs)',
    '5kg Bottle Bal', '19kg Bottle Bal', '47.5kg Bottle Bal', 'Total Bottle Bal'
  ];

  const defaultBalance = () => ({
    '5kg': { filledGiven: 0, emptyCollected: 0 },
    '19kg': { filledGiven: 0, emptyCollected: 0 },
    '47.5kg': { filledGiven: 0, emptyCollected: 0 },
  });

  const rows = customers.map(c => {
    const bal = c.bottleBalance || defaultBalance();
    const getNet = (type) => {
      const b = bal[type] || { filledGiven: 0, emptyCollected: 0 };
      return b.filledGiven - b.emptyCollected;
    };
    const b5 = getNet('5kg');
    const b19 = getNet('19kg');
    const b47 = getNet('47.5kg');
    const total = b5 + b19 + b47;

    return [
      c.id, c.name, c.phone, c.address, c.type,
      c.prices['5kg'], c.prices['19kg'], c.prices['47.5kg'],
      b5, b19, b47, total
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Customers.xlsx');
}

export function exportStockExcel(stock) {
  const headers = ['Cylinder Type', 'Filled Bottles', 'Empty Bottles', 'Total'];
  const rows = stock.map(s => [s.cylinderType, s.filledCount, s.emptyCount, s.filledCount + s.emptyCount]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Stock-Report.xlsx');
}

export function exportDailyReportExcel(data) {
  const headers = ['Date', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)'];
  const rows = data.map(d => [d.date, d.totalInvoices, d.revenue, d.collected, d.outstanding]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Daily-Report.xlsx');
}

export function exportMonthlyReportExcel(data) {
  const headers = ['Month', 'Total Invoices', 'Revenue (Rs)', 'Collected (Rs)', 'Outstanding (Rs)'];
  const rows = data.map(d => [d.month, d.totalInvoices, d.revenue, d.collected, d.outstanding]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'JIG-Monthly-Report.xlsx');
}

export function exportCustomerReportExcel(customer, invoices) {
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = totalBusiness - totalPaid;

  const summaryData = [
    ['JAYDEEP INDIAN GAS AGENCY - CUSTOMER STATEMENT'],
    [],
    ['Customer Name:', customer.name],
    ['Phone:', customer.phone],
    ['Address:', customer.address],
    [],
    ['Total Business (Rs):', totalBusiness],
    ['Total Paid (Rs):', totalPaid],
    ['Balance Due (Rs):', totalDue],
    [],
    ['Date', 'Invoice No', 'Items', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Notes']
  ];

  const rows = invoices.map(inv => [
    inv.date,
    inv.invoiceNumber,
    inv.items.map(i => `${i.qty}x${i.cylinderType}`).join(', '),
    inv.totalAmount,
    inv.paidAmount,
    inv.totalAmount - inv.paidAmount,
    inv.paymentStatus,
    inv.notes || ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...summaryData, ...rows]);
  ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Statement-${customer.name.replace(/\s+/g, '-')}.xlsx`);
}
