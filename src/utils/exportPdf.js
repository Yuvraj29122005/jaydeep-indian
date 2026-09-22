import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportInvoicePDF(invoice) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYDEEP INDIAN GAS AGENCY', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Authorized Indian Gas Distributor | Surat, Gujarat', 105, 27, { align: 'center' });
  doc.text('Phone: 9876543210 | GSTIN: 24ABCDE1234F1Z5', 105, 34, { align: 'center' });

  const isEB = invoice.invoiceType === 'Empty Bottle';

  // Invoice badge
  doc.setFillColor(isEB ? 59 : 255, isEB ? 130 : 165, isEB ? 246 : 0);
  doc.roundedRect(130, 50, 70, 28, 3, 3, 'F');
  doc.setTextColor(isEB ? 255 : 15, isEB ? 255 : 23, isEB ? 255 : 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(isEB ? 'EMPTY BOTTLE RECEIPT' : 'TAX INVOICE', 165, 60, { align: 'center' });
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, 165, 70, { align: 'center' });

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
  doc.text('Bill To:', 14, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName, 14, 97);
  doc.text(invoice.customerPhone || '', 14, 104);
  const addrLines = doc.splitTextToSize(invoice.customerAddress || '', 90);
  doc.text(addrLines, 14, 111);

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
          item.qty,
          `Rs. ${(Number(item.unitPrice) || 0).toLocaleString('en-IN')}`,
          `Rs. ${amt.toLocaleString('en-IN')}`,
          '✓ Collected',
        ]
      : [
          item.cylinderType,
          item.qty,
          `Rs. ${(Number(item.unitPrice) || 0).toLocaleString('en-IN')}`,
          `Rs. ${(Number(mktPrice) || 0).toLocaleString('en-IN')}`,
          discPct,
          `Rs. ${amt.toLocaleString('en-IN')}`,
          item.emptyCollected ? '✓ Yes' : '✗ No',
        ];
  });

  autoTable(doc, {
    startY: 125,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Totals
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Amount:`, 120, finalY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${invoice.totalAmount.toLocaleString('en-IN')}`, 196, finalY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Amount Paid:`, 120, finalY + 8);
  doc.setFillColor(22, 163, 74);
  doc.text(`Rs. ${invoice.paidAmount.toLocaleString('en-IN')}`, 196, finalY + 8, { align: 'right' });

  const balance = invoice.totalAmount - invoice.paidAmount;
  if (balance > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Balance Due:`, 120, finalY + 16);
    doc.text(`Rs. ${balance.toLocaleString('en-IN')}`, 196, finalY + 16, { align: 'right' });
  }

  if (invoice.notes) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`Notes: ${invoice.notes}`, 14, finalY + 28);
  }

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business! — Jaydeep Indian Gas Agency', 105, 285, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function exportAllInvoicesPDF(invoices) {
  const doc = new jsPDF();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYDEEP INDIAN GAS AGENCY — All Invoices', 105, 20, { align: 'center' });

  // Summary
  const totalRev = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
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
    `Rs. ${inv.paidAmount.toLocaleString('en-IN')}`,
    `Rs. ${(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}`,
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

  doc.save('JIG-All-Invoices.pdf');
}

export function exportCustomerReportPDF(customer, invoices, marketPrices) {
  const doc = new jsPDF();
  const mkt = marketPrices || {};
  const cylTypes = ['5kg', '19kg', '47.5kg'];

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JAYDEEP INDIAN GAS AGENCY', 105, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Customer Statement', 105, 26, { align: 'center' });

  // Customer Info
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.name}`, 14, 34);
  doc.text(`Phone: ${customer.phone}`, 14, 40);
  doc.text(`Address: ${customer.address}`, 105, 34);
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
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
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
      `Rs. ${inv.paidAmount.toLocaleString('en-IN')}`,
      `Rs. ${(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}`,
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
