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

  // Invoice badge
  doc.setFillColor(255, 165, 0);
  doc.roundedRect(140, 50, 60, 28, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 170, 60, { align: 'center' });
  doc.setFontSize(10);
  doc.text(invoice.invoiceNumber, 170, 70, { align: 'center' });

  // Invoice info
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${invoice.date}`, 14, 58);
  doc.text(`Payment Mode: ${invoice.paymentMode}`, 14, 66);

  const deliveryColor = invoice.deliveryStatus === 'Delivered' ? [22, 163, 74]
    : invoice.deliveryStatus === 'Out for Delivery' ? [234, 88, 12] : [100, 116, 139];
  doc.setFillColor(...deliveryColor);
  doc.roundedRect(14, 70, 50, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`Delivery: ${invoice.deliveryStatus}`, 39, 75, { align: 'center' });

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
  const tableBody = invoice.items.map(item => [
    item.cylinderType,
    item.qty,
    `Rs. ${item.unitPrice.toLocaleString('en-IN')}`,
    `Rs. ${(item.qty * item.unitPrice).toLocaleString('en-IN')}`,
    item.emptyCollected ? '✓ Yes' : '✗ No',
  ]);

  autoTable(doc, {
    startY: 125,
    head: [['Cylinder', 'Qty', 'Unit Price', 'Amount', 'Empty Collected']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 4 },
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

  const tableBody = invoices.map(inv => [
    inv.invoiceNumber,
    inv.date,
    inv.customerName,
    `Rs. ${inv.totalAmount.toLocaleString('en-IN')}`,
    `Rs. ${inv.paidAmount.toLocaleString('en-IN')}`,
    inv.paymentMode,
    inv.deliveryStatus,
    inv.paymentStatus,
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Invoice No', 'Date', 'Customer', 'Total', 'Paid', 'Mode', 'Delivery', 'Payment']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save('JIG-All-Invoices.pdf');
}

export function exportCustomerReportPDF(customer, invoices) {
  const doc = new jsPDF();

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

  // Totals
  const totalBusiness = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = totalBusiness - totalPaid;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Business: Rs. ${totalBusiness.toLocaleString('en-IN')}`, 14, 55);
  doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString('en-IN')}`, 80, 55);
  doc.setTextColor(220, 38, 38);
  doc.text(`Balance Due: Rs. ${totalDue.toLocaleString('en-IN')}`, 145, 55);

  const tableBody = invoices.map(inv => [
    inv.date,
    inv.invoiceNumber,
    inv.items.map(i => `${i.qty}x${i.cylinderType}`).join(', '),
    `Rs. ${inv.totalAmount.toLocaleString('en-IN')}`,
    `Rs. ${inv.paidAmount.toLocaleString('en-IN')}`,
    inv.paymentStatus,
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Date', 'Invoice No', 'Items', 'Amount', 'Paid', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 165, 0], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`Statement-${customer.name.replace(/\s+/g, '-')}.pdf`);
}
