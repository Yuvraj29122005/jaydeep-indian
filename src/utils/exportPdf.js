import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export function exportInvoicePDF(invoice, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 48, 'F');
  
  // Agency / Company Name
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text((settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase(), 105, 15, { align: 'center' });

  // Subtitle / Legal line
  doc.setFontSize(9.5);
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  const subText = `${settings.tagline || 'Authorized Indian Gas Distributor'}${settings.city ? ` | ${settings.city}, ${settings.state}` : ''}`;
  doc.text(subText, 105, 23, { align: 'center' });

  // GST & Contact Line
  doc.setFontSize(8.5);
  doc.setTextColor(200, 200, 200);
  const contactText = `Phone: ${settings.phone || '9876543210'}${settings.alternatePhone ? ` / ${settings.alternatePhone}` : ''} | GSTIN: ${settings.gstin || '24ABCDE1234F1Z5'}${settings.panNumber ? ` | PAN: ${settings.panNumber}` : ''}`;
  doc.text(contactText, 105, 30, { align: 'center' });

  // Address & Email Line
  if (settings.address || settings.email) {
    doc.setFontSize(8);
    doc.setTextColor(170, 180, 195);
    const addrEmail = [settings.address, settings.email].filter(Boolean).join(' | ');
    doc.text(addrEmail, 105, 37, { align: 'center' });
  }

  const isEB = invoice.invoiceType === 'Empty Bottle';

  // Invoice badge
  doc.setFillColor(isEB ? 59 : 255, isEB ? 130 : 165, isEB ? 246 : 0);
  doc.roundedRect(130, 52, 70, 28, 3, 3, 'F');
  doc.setTextColor(isEB ? 255 : 15, isEB ? 255 : 23, isEB ? 255 : 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(isEB ? 'EMPTY BOTTLE RECEIPT' : 'TAX INVOICE', 165, 62, { align: 'center' });
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, 165, 72, { align: 'center' });

  // Invoice info
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${invoice.date}`, 14, 58);
  doc.text(`Payment Mode: ${invoice.paymentMode}`, 14, 66);

  const deliveryColor = invoice.deliveryStatus === 'Delivered' || invoice.deliveryStatus === 'Collected' ? [22, 163, 74]
    : invoice.deliveryStatus === 'Out for Delivery' ? [234, 88, 12] : [100, 116, 139];
  doc.setFillColor(...deliveryColor);
  doc.roundedRect(14, 70, 50, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Status: ${invoice.deliveryStatus}`, 39, 75, { align: 'center' });

  const payColor = invoice.paymentStatus === 'Paid' ? [22, 163, 74]
    : invoice.paymentStatus === 'Partial' ? [234, 88, 12] : [220, 38, 38];
  doc.setFillColor(...payColor);
  doc.roundedRect(68, 70, 45, 7, 2, 2, 'F');
  doc.text(`Payment: ${invoice.paymentStatus}`, 90.5, 75, { align: 'center' });

  // Bill to
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 14, 95);
  doc.text(invoice.customerPhone || '', 14, 101);
  const addrLines = doc.splitTextToSize(invoice.customerAddress || '', 90);
  doc.text(addrLines, 14, 107);

  // Items table
  const tableHead = isEB
    ? [['Cylinder', 'Empty Collected', 'Rate/Refund', 'Amount', 'Status']]
    : [['Cylinder', 'Qty', 'Unit Price', 'Market Price', 'Discount', 'Amount', 'Empty']];

  const tableBody = invoice.items.map(item => {
    const mktPrice = item.marketPrice || item.unitPrice;
    const discPct = mktPrice > 0 && item.unitPrice < mktPrice
      ? `${(((mktPrice - item.unitPrice) / mktPrice) * 100).toFixed(1)}%`
      : '0%';
    const amt = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);

    return isEB
      ? [
          item.cylinderType,
          `${item.qty} bottles`,
          item.unitPrice > 0 ? `Rs. ${item.unitPrice}` : 'Rs. 0 (Collection)',
          `Rs. ${amt.toLocaleString('en-IN')}`,
          'Collected',
        ]
      : [
          item.cylinderType,
          item.qty,
          `Rs. ${item.unitPrice}`,
          `Rs. ${mktPrice}`,
          discPct,
          `Rs. ${amt.toLocaleString('en-IN')}`,
          item.emptyCollected ? `Yes (${item.emptyCount !== undefined ? item.emptyCount : item.qty})` : 'No',
        ];
  });

  autoTable(doc, {
    startY: Math.max(118, 107 + (addrLines.length * 5)),
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: isEB ? [59, 130, 246] : [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Totals Box
  doc.setFillColor(248, 250, 252);
  doc.rect(115, finalY - 4, 85, 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(115, finalY - 4, 85, 30, 'S');

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Amount:`, 120, finalY + 3);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${invoice.totalAmount.toLocaleString('en-IN')}`, 194, finalY + 3, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Amount Paid:`, 120, finalY + 11);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${(Number(invoice.paidAmount) || 0).toLocaleString('en-IN')}`, 194, finalY + 11, { align: 'right' });

  const balance = invoice.totalAmount - (Number(invoice.paidAmount) || 0);
  if (balance > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Balance Due:`, 120, finalY + 19);
    doc.text(`Rs. ${balance.toLocaleString('en-IN')}`, 194, finalY + 19, { align: 'right' });
  }

  // Bank & UPI Box on left
  let extraY = finalY;
  if (settings.bankName || settings.upiId) {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, extraY - 4, 95, 30, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, extraY - 4, 95, 30, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('BANK & UPI PAYMENT DETAILS', 18, extraY + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Bank: ${settings.bankName || 'State Bank of India'} | A/C: ${settings.accountNumber || '—'}`, 18, extraY + 8);
    doc.text(`IFSC: ${settings.ifscCode || '—'} | Branch: ${settings.branch || '—'}`, 18, extraY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(`UPI VPA: ${settings.upiId || '—'}`, 18, extraY + 20);
    extraY += 34;
  } else {
    extraY += 28;
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Notes: ${invoice.notes}`, 14, extraY);
    extraY += 8;
  }

  // Terms and Signatory Box
  const termsY = Math.max(extraY + 4, 230);
  if (settings.invoiceTerms && termsY < 265) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('TERMS & CONDITIONS:', 14, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const splitTerms = doc.splitTextToSize(settings.invoiceTerms, 115);
    doc.text(splitTerms, 14, termsY + 4);
  }

  // Authorized Signatory
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${(settings.agencyName || 'Jaydeep Indian Gas Agency').toUpperCase()}`, 196, termsY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${settings.signatoryTitle || 'Authorized Signatory'})`, 196, termsY + 22, { align: 'right' });

  // Footer Note
  doc.setTextColor(140, 150, 160);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const footerNote = settings.invoiceFooterNote || `Thank you for your business! — ${settings.agencyName}`;
  doc.text(footerNote, 105, 287, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function exportAllInvoicesPDF(invoices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const doc = new jsPDF();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${(settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase()} — All Invoices`, 105, 20, { align: 'center' });

  // Summary
  const totalRev = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const totalDue = totalRev - totalPaid;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Invoices: ${invoices.length}  |  Revenue: Rs. ${totalRev.toLocaleString('en-IN')}  |  Collected: Rs. ${totalPaid.toLocaleString('en-IN')}  |  Outstanding: Rs. ${totalDue.toLocaleString('en-IN')}`, 14, 38);

  const tableBody = invoices.map(inv => [
    inv.invoiceNumber,
    inv.invoiceType === 'Empty Bottle' ? 'EB' : 'Refill',
    inv.date,
    inv.customerName,
    inv.items.map(i => `${i.qty}x${i.cylinderType}`).join(', '),
    `Rs. ${inv.totalAmount.toLocaleString('en-IN')}`,
    `Rs. ${(Number(inv.paidAmount) || 0).toLocaleString('en-IN')}`,
    `Rs. ${(inv.totalAmount - (Number(inv.paidAmount) || 0)).toLocaleString('en-IN')}`,
    inv.paymentStatus,
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Invoice No', 'Type', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Balance', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 6.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${(settings.invoicePrefix || 'JIG')}-All-Invoices.pdf`);
}

export function exportCustomerReportPDF(customer, invoices, marketPrices, customSettings = null) {
  const settings = getActiveAgencySettings(customSettings);
  const doc = new jsPDF();
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text((settings.agencyName || 'JAYDEEP INDIAN GAS AGENCY').toUpperCase(), 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Customer Statement | GSTIN: ${settings.gstin || '—'}`, 105, 26, { align: 'center' });

  // Customer Info
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name}`, 14, 34);
  doc.text(`Phone: ${customer.phone}`, 14, 40);
  doc.text(`Address: ${customer.address || '—'}`, 105, 34);
  doc.text(`Type: ${customer.type || 'N/A'}`, 105, 40);

  // Price Comparison Table
  const priceTableBody = cylTypes.map(t => {
    const mktP = Number(mkt[t]) || 0;
    const custP = customer.prices?.[t] !== undefined ? Number(customer.prices[t]) : mktP;
    const discAmt = Math.max(0, mktP - custP);
    const discPct = mktP > 0 ? ((discAmt / mktP) * 100).toFixed(1) : '0.0';
    return [
      t,
      `Rs. ${mktP.toLocaleString('en-IN')}`,
      `Rs. ${custP.toLocaleString('en-IN')}`,
      `Rs. ${discAmt.toLocaleString('en-IN')}`,
      `${discPct}%`
    ];
  });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Pricing & Discount Comparison', 14, 53);

  autoTable(doc, {
    startY: 56,
    head: [['Cylinder', 'Market Price', 'Customer Price', 'Discount (Rs)', 'Discount (%)']],
    body: priceTableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let curY = doc.lastAutoTable.finalY + 8;

  // Financial Summary
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalDue = totalBusiness - totalPaid;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Business: Rs. ${totalBusiness.toLocaleString('en-IN')}`, 14, curY);
  doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString('en-IN')}`, 80, curY);
  doc.setTextColor(220, 38, 38);
  doc.text(`Balance Due: Rs. ${totalDue.toLocaleString('en-IN')}`, 145, curY);

  // Transaction Table
  const tableBody = invoices.map(inv => {
    const isEB = inv.invoiceType === 'Empty Bottle';
    return [
      inv.date,
      inv.invoiceNumber,
      isEB ? 'EB' : 'Refill',
      inv.items.map(i => `${i.qty}x${i.cylinderType}`).join(', '),
      `Rs. ${inv.totalAmount.toLocaleString('en-IN')}`,
      `Rs. ${(Number(inv.paidAmount) || 0).toLocaleString('en-IN')}`,
      `Rs. ${(inv.totalAmount - (Number(inv.paidAmount) || 0)).toLocaleString('en-IN')}`,
      inv.paymentStatus,
    ];
  });

  autoTable(doc, {
    startY: curY + 6,
    head: [['Date', 'Invoice No', 'Type', 'Items', 'Amount', 'Paid', 'Balance', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`Statement-${customer.name.replace(/\s+/g, '-')}.pdf`);
}
