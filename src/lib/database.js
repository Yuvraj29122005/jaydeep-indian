import { supabase } from './supabase';

// ==================== CUSTOMERS ====================

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapCustomerFromDB);
}

export async function insertCustomer(customer) {
  const dbCustomer = mapCustomerToDB(customer);
  const { data, error } = await supabase
    .from('customers')
    .insert(dbCustomer)
    .select()
    .single();
  if (error) throw error;
  return mapCustomerFromDB(data);
}

export async function patchCustomer(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.prices !== undefined) dbUpdates.prices = updates.prices;
  if (updates.bottleBalance !== undefined) dbUpdates.bottle_balance = updates.bottleBalance;

  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCustomerFromDB(data);
}

export async function removeCustomer(id) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapCustomerFromDB(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    type: row.type,
    prices: row.prices || { '5kg': 450, '19kg': 950, '47.5kg': 2200 },
    bottleBalance: row.bottle_balance || {
      '5kg': { filledGiven: 0, emptyCollected: 0 },
      '19kg': { filledGiven: 0, emptyCollected: 0 },
      '47.5kg': { filledGiven: 0, emptyCollected: 0 },
    },
  };
}

function mapCustomerToDB(customer) {
  return {
    name: customer.name,
    phone: customer.phone,
    address: customer.address || '',
    type: customer.type || 'Domestic',
    prices: customer.prices || { '5kg': 450, '19kg': 950, '47.5kg': 2200 },
    bottle_balance: customer.bottleBalance || {
      '5kg': { filledGiven: 0, emptyCollected: 0 },
      '19kg': { filledGiven: 0, emptyCollected: 0 },
      '47.5kg': { filledGiven: 0, emptyCollected: 0 },
    },
  };
}

// ==================== STOCK ====================

export async function fetchStock() {
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .order('cylinder_type', { ascending: true });
  if (error) throw error;
  return data.map(mapStockFromDB);
}

export async function patchStock(cylinderType, updates) {
  const dbUpdates = {};
  if (updates.filledCount !== undefined) dbUpdates.filled_count = updates.filledCount;
  if (updates.emptyCount !== undefined) dbUpdates.empty_count = updates.emptyCount;

  const { data, error } = await supabase
    .from('stock')
    .update(dbUpdates)
    .eq('cylinder_type', cylinderType)
    .select()
    .single();
  if (error) throw error;
  return mapStockFromDB(data);
}

function mapStockFromDB(row) {
  return {
    id: row.id,
    cylinderType: row.cylinder_type,
    filledCount: row.filled_count,
    emptyCount: row.empty_count,
  };
}

// ==================== INVOICES ====================

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapInvoiceFromDB);
}

export async function insertInvoice(invoice) {
  const dbInvoice = mapInvoiceToDB(invoice);
  const { data, error } = await supabase
    .from('invoices')
    .insert(dbInvoice)
    .select()
    .single();
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

export async function patchInvoice(id, updates) {
  const dbUpdates = {};
  if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
  if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
  if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
  if (updates.customerAddress !== undefined) dbUpdates.customer_address = updates.customerAddress;
  if (updates.items !== undefined) dbUpdates.items = updates.items;
  if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
  if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
  if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
  if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
  if (updates.deliveryStatus !== undefined) dbUpdates.delivery_status = updates.deliveryStatus;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.privateNotes !== undefined) dbUpdates.private_notes = updates.privateNotes;
  if (updates.paymentScreenshot !== undefined) dbUpdates.payment_screenshot = updates.paymentScreenshot;

  const { data, error } = await supabase
    .from('invoices')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

function mapInvoiceFromDB(row) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    date: row.date,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    items: row.items || [],
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    deliveryStatus: row.delivery_status || 'Pending',
    notes: row.notes || '',
    privateNotes: row.private_notes || '',
    paymentScreenshot: row.payment_screenshot || '',
  };
}

function mapInvoiceToDB(invoice) {
  return {
    invoice_number: invoice.invoiceNumber,
    date: invoice.date,
    customer_id: invoice.customerId,
    customer_name: invoice.customerName,
    customer_phone: invoice.customerPhone,
    customer_address: invoice.customerAddress,
    items: invoice.items,
    total_amount: invoice.totalAmount,
    paid_amount: invoice.paidAmount,
    payment_mode: invoice.paymentMode,
    payment_status: invoice.paymentStatus || 'Unpaid',
    delivery_status: invoice.deliveryStatus || 'Pending',
    notes: invoice.notes || '',
    private_notes: invoice.privateNotes || '',
    payment_screenshot: invoice.paymentScreenshot || '',
  };
}

// ==================== EXPENSES ====================

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapExpenseFromDB);
}

export async function insertExpense(expense) {
  const dbExpense = {
    date: expense.date,
    amount: expense.amount,
    type: expense.type,
    description: expense.description,
  };
  const { data, error } = await supabase
    .from('expenses')
    .insert(dbExpense)
    .select()
    .single();
  if (error) throw error;
  return mapExpenseFromDB(data);
}

export async function patchExpense(id, updates) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapExpenseFromDB(data);
}

export async function removeExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapExpenseFromDB(row) {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type,
    description: row.description,
  };
}

// ==================== REFILL TRIPS ====================

export async function fetchRefillTrips() {
  const { data, error } = await supabase
    .from('refill_trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapRefillTripFromDB);
}

export async function insertRefillTrip(trip) {
  const dbTrip = {
    cylinder_type: trip.cylinderType,
    empty_sent_count: trip.emptySentCount,
    status: 'Sent',
    date_sent: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('refill_trips')
    .insert(dbTrip)
    .select()
    .single();
  if (error) throw error;
  return mapRefillTripFromDB(data);
}

export async function patchRefillTrip(id, updates) {
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.filledReturnedCount !== undefined) dbUpdates.filled_returned_count = updates.filledReturnedCount;
  if (updates.dateReturned !== undefined) dbUpdates.date_returned = updates.dateReturned;

  const { data, error } = await supabase
    .from('refill_trips')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapRefillTripFromDB(data);
}

function mapRefillTripFromDB(row) {
  return {
    id: row.id,
    cylinderType: row.cylinder_type,
    emptySentCount: row.empty_sent_count,
    filledReturnedCount: row.filled_returned_count,
    status: row.status,
    dateSent: row.date_sent,
    dateReturned: row.date_returned,
  };
}

