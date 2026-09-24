import { supabase } from './supabase';
import { CYLINDER_TYPES, DEFAULT_MARKET_PRICES, DEFAULT_AGENCY_SETTINGS } from './constants';

// ==================== MARKET PRICES ====================

const LOCAL_MARKET_KEY = 'jig_market_prices';
const LOCAL_MARKET_META_KEY = 'jig_market_prices_meta';

export async function fetchMarketPrices() {
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const row = data[0];
      const prices = row.prices || DEFAULT_MARKET_PRICES;
      const meta = {
        updatedAt: row.updated_at,
        updatedBy: row.updated_by || 'Admin'
      };
      try {
        localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(prices));
        localStorage.setItem(LOCAL_MARKET_META_KEY, JSON.stringify(meta));
      } catch (_e) {}
      return { prices, meta };
    }
  } catch (err) {
    console.warn('Supabase fetchMarketPrices error, falling back:', err);
  }

  // Fallback to localStorage or defaults
  try {
    const saved = localStorage.getItem(LOCAL_MARKET_KEY);
    const savedMeta = localStorage.getItem(LOCAL_MARKET_META_KEY);
    if (saved) {
      return {
        prices: JSON.parse(saved),
        meta: savedMeta ? JSON.parse(savedMeta) : { updatedAt: null, updatedBy: 'Admin' }
      };
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  return {
    prices: DEFAULT_MARKET_PRICES,
    meta: { updatedAt: null, updatedBy: 'Admin' }
  };
}

export async function saveMarketPrices(prices, updatedBy = 'Admin') {
  const timestamp = new Date().toISOString();
  try {
    localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(prices));
    localStorage.setItem(LOCAL_MARKET_META_KEY, JSON.stringify({ updatedAt: timestamp, updatedBy }));
  } catch (_e) {}

  try {
    const { data, error } = await supabase
      .from('market_prices')
      .insert({
        prices,
        updated_at: timestamp,
        updated_by: updatedBy
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase market_prices table insert error (run migration SQL):', error.message);
    }
    return {
      prices: data?.prices || prices,
      meta: { updatedAt: data?.updated_at || timestamp, updatedBy }
    };
  } catch (err) {
    console.warn('Supabase saveMarketPrices table not available, saved locally:', err);
    return { prices, meta: { updatedAt: timestamp, updatedBy } };
  }
}

// ==================== AGENCY SETTINGS & CONFIG ====================

const LOCAL_AGENCY_SETTINGS_KEY = 'jig_agency_settings';

export function mapAgencySettingsFromDB(row) {
  if (!row) return DEFAULT_AGENCY_SETTINGS;
  return {
    id: row.id,
    agencyName: row.agency_name || DEFAULT_AGENCY_SETTINGS.agencyName,
    companyName: row.company_name || row.agency_name || DEFAULT_AGENCY_SETTINGS.companyName,
    tagline: row.tagline !== undefined ? row.tagline : DEFAULT_AGENCY_SETTINGS.tagline,
    gstin: row.gstin !== undefined ? row.gstin : DEFAULT_AGENCY_SETTINGS.gstin,
    panNumber: row.pan_number !== undefined ? row.pan_number : DEFAULT_AGENCY_SETTINGS.panNumber,
    phone: row.phone !== undefined ? row.phone : DEFAULT_AGENCY_SETTINGS.phone,
    alternatePhone: row.alternate_phone !== undefined ? row.alternate_phone : DEFAULT_AGENCY_SETTINGS.alternatePhone,
    email: row.email !== undefined ? row.email : DEFAULT_AGENCY_SETTINGS.email,
    website: row.website !== undefined ? row.website : DEFAULT_AGENCY_SETTINGS.website,
    address: row.address !== undefined ? row.address : DEFAULT_AGENCY_SETTINGS.address,
    city: row.city !== undefined ? row.city : DEFAULT_AGENCY_SETTINGS.city,
    state: row.state !== undefined ? row.state : DEFAULT_AGENCY_SETTINGS.state,
    pincode: row.pincode !== undefined ? row.pincode : DEFAULT_AGENCY_SETTINGS.pincode,
    bankName: row.bank_name !== undefined ? row.bank_name : DEFAULT_AGENCY_SETTINGS.bankName,
    accountHolder: row.account_holder !== undefined ? row.account_holder : DEFAULT_AGENCY_SETTINGS.accountHolder,
    accountNumber: row.account_number !== undefined ? row.account_number : DEFAULT_AGENCY_SETTINGS.accountNumber,
    ifscCode: row.ifsc_code !== undefined ? row.ifsc_code : DEFAULT_AGENCY_SETTINGS.ifscCode,
    branch: row.branch !== undefined ? row.branch : DEFAULT_AGENCY_SETTINGS.branch,
    upiId: row.upi_id !== undefined ? row.upi_id : DEFAULT_AGENCY_SETTINGS.upiId,
    invoicePrefix: row.invoice_prefix || DEFAULT_AGENCY_SETTINGS.invoicePrefix,
    emptyBottlePrefix: row.empty_bottle_prefix || DEFAULT_AGENCY_SETTINGS.emptyBottlePrefix,
    invoiceTerms: row.invoice_terms !== undefined ? row.invoice_terms : DEFAULT_AGENCY_SETTINGS.invoiceTerms,
    invoiceFooterNote: row.invoice_footer_note !== undefined ? row.invoice_footer_note : DEFAULT_AGENCY_SETTINGS.invoiceFooterNote,
    signatoryTitle: row.signatory_title !== undefined ? row.signatory_title : DEFAULT_AGENCY_SETTINGS.signatoryTitle,
    updatedAt: row.updated_at || null,
    updatedBy: row.updated_by || 'Admin'
  };
}

export function mapAgencySettingsToDB(settings, updatedBy = 'Admin') {
  return {
    agency_name: settings.agencyName || DEFAULT_AGENCY_SETTINGS.agencyName,
    company_name: settings.companyName || settings.agencyName || DEFAULT_AGENCY_SETTINGS.companyName,
    tagline: settings.tagline !== undefined ? settings.tagline : DEFAULT_AGENCY_SETTINGS.tagline,
    gstin: settings.gstin !== undefined ? settings.gstin : DEFAULT_AGENCY_SETTINGS.gstin,
    pan_number: settings.panNumber !== undefined ? settings.panNumber : DEFAULT_AGENCY_SETTINGS.panNumber,
    phone: settings.phone !== undefined ? settings.phone : DEFAULT_AGENCY_SETTINGS.phone,
    alternate_phone: settings.alternatePhone !== undefined ? settings.alternatePhone : DEFAULT_AGENCY_SETTINGS.alternatePhone,
    email: settings.email !== undefined ? settings.email : DEFAULT_AGENCY_SETTINGS.email,
    website: settings.website !== undefined ? settings.website : DEFAULT_AGENCY_SETTINGS.website,
    address: settings.address !== undefined ? settings.address : DEFAULT_AGENCY_SETTINGS.address,
    city: settings.city !== undefined ? settings.city : DEFAULT_AGENCY_SETTINGS.city,
    state: settings.state !== undefined ? settings.state : DEFAULT_AGENCY_SETTINGS.state,
    pincode: settings.pincode !== undefined ? settings.pincode : DEFAULT_AGENCY_SETTINGS.pincode,
    bank_name: settings.bankName !== undefined ? settings.bankName : DEFAULT_AGENCY_SETTINGS.bankName,
    account_holder: settings.accountHolder !== undefined ? settings.accountHolder : DEFAULT_AGENCY_SETTINGS.accountHolder,
    account_number: settings.accountNumber !== undefined ? settings.accountNumber : DEFAULT_AGENCY_SETTINGS.accountNumber,
    ifsc_code: settings.ifscCode !== undefined ? settings.ifscCode : DEFAULT_AGENCY_SETTINGS.ifscCode,
    branch: settings.branch !== undefined ? settings.branch : DEFAULT_AGENCY_SETTINGS.branch,
    upi_id: settings.upiId !== undefined ? settings.upiId : DEFAULT_AGENCY_SETTINGS.upiId,
    invoice_prefix: settings.invoicePrefix || DEFAULT_AGENCY_SETTINGS.invoicePrefix,
    empty_bottle_prefix: settings.emptyBottlePrefix || DEFAULT_AGENCY_SETTINGS.emptyBottlePrefix,
    invoice_terms: settings.invoiceTerms !== undefined ? settings.invoiceTerms : DEFAULT_AGENCY_SETTINGS.invoiceTerms,
    invoice_footer_note: settings.invoiceFooterNote !== undefined ? settings.invoiceFooterNote : DEFAULT_AGENCY_SETTINGS.invoiceFooterNote,
    signatory_title: settings.signatoryTitle !== undefined ? settings.signatoryTitle : DEFAULT_AGENCY_SETTINGS.signatoryTitle,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy
  };
}

export async function fetchAgencySettings() {
  try {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const settings = mapAgencySettingsFromDB(data[0]);
      try {
        localStorage.setItem(LOCAL_AGENCY_SETTINGS_KEY, JSON.stringify(settings));
      } catch (_e) {}
      return { settings, syncedWithSupabase: true };
    }
  } catch (err) {
    console.warn('Supabase fetchAgencySettings error, falling back:', err);
  }

  // Fallback to localStorage or defaults
  try {
    const saved = localStorage.getItem(LOCAL_AGENCY_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        settings: { ...DEFAULT_AGENCY_SETTINGS, ...parsed },
        syncedWithSupabase: false
      };
    }
  } catch (e) {
    console.warn('LocalStorage agency settings read error:', e);
  }

  return {
    settings: { ...DEFAULT_AGENCY_SETTINGS },
    syncedWithSupabase: false
  };
}

export async function saveAgencySettings(settings, updatedBy = 'Admin') {
  const timestamp = new Date().toISOString();
  const mergedSettings = {
    ...DEFAULT_AGENCY_SETTINGS,
    ...settings,
    updatedAt: timestamp,
    updatedBy
  };

  // Always save locally immediately
  try {
    localStorage.setItem(LOCAL_AGENCY_SETTINGS_KEY, JSON.stringify(mergedSettings));
  } catch (_e) {}

  // Attempt database sync
  try {
    const dbPayload = mapAgencySettingsToDB(mergedSettings, updatedBy);

    const { data: existingRows, error: selectErr } = await supabase
      .from('agency_settings')
      .select('id')
      .limit(1);

    if (selectErr) {
      throw selectErr;
    }

    let savedData = null;
    if (existingRows && existingRows.length > 0) {
      const { data, error } = await supabase
        .from('agency_settings')
        .update(dbPayload)
        .eq('id', existingRows[0].id)
        .select()
        .single();
      if (error) throw error;
      savedData = data;
    } else {
      const { data, error } = await supabase
        .from('agency_settings')
        .insert(dbPayload)
        .select()
        .single();
      if (error) throw error;
      savedData = data;
    }

    const finalSettings = mapAgencySettingsFromDB(savedData);
    try {
      localStorage.setItem(LOCAL_AGENCY_SETTINGS_KEY, JSON.stringify(finalSettings));
    } catch (_e) {}

    return {
      settings: finalSettings,
      syncedWithSupabase: true
    };
  } catch (err) {
    console.warn('Supabase saveAgencySettings note (run migration SQL if table missing):', err.message || err);
    return {
      settings: mergedSettings,
      syncedWithSupabase: false,
      error: err.message
    };
  }
}

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
  const { data: current, error: fetchErr } = await supabase.from('customers').select('*').eq('id', id).single();
  if (fetchErr) throw fetchErr;

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.type !== undefined) dbUpdates.type = updates.type;

  if (updates.prices !== undefined || updates.discounts !== undefined) {
    const curPrices = current.prices || {};
    const curDiscounts = curPrices.discounts || { '5kg': 0, '19kg': 0, '47.5kg': 0 };
    const newDiscounts = updates.discounts || updates.prices?.discounts || curDiscounts;

    dbUpdates.prices = {
      '5kg': updates.prices?.['5kg'] !== undefined ? Number(updates.prices['5kg']) : (Number(curPrices['5kg']) || 450),
      '19kg': updates.prices?.['19kg'] !== undefined ? Number(updates.prices['19kg']) : (Number(curPrices['19kg']) || 950),
      '47.5kg': updates.prices?.['47.5kg'] !== undefined ? Number(updates.prices['47.5kg']) : (Number(curPrices['47.5kg']) || 2200),
      discounts: newDiscounts,
    };
  }
  
  if (updates.bottleBalance !== undefined || updates.emptyBottleStock !== undefined) {
    const currentBal = current.bottle_balance || {};
    const newBal = updates.bottleBalance;
    const newStock = updates.emptyBottleStock;
    
    dbUpdates.bottle_balance = {
      '5kg': {
        filledGiven: newBal ? (newBal['5kg']?.filledGiven || 0) : (currentBal['5kg']?.filledGiven || 0),
        emptyCollected: newBal ? (newBal['5kg']?.emptyCollected || 0) : (currentBal['5kg']?.emptyCollected || 0),
        stock: newStock ? (newStock['5kg'] || {withCustomer:0, collected:0}) : (currentBal['5kg']?.stock || {withCustomer:0, collected:0})
      },
      '19kg': {
        filledGiven: newBal ? (newBal['19kg']?.filledGiven || 0) : (currentBal['19kg']?.filledGiven || 0),
        emptyCollected: newBal ? (newBal['19kg']?.emptyCollected || 0) : (currentBal['19kg']?.emptyCollected || 0),
        stock: newStock ? (newStock['19kg'] || {withCustomer:0, collected:0}) : (currentBal['19kg']?.stock || {withCustomer:0, collected:0})
      },
      '47.5kg': {
        filledGiven: newBal ? (newBal['47.5kg']?.filledGiven || 0) : (currentBal['47.5kg']?.filledGiven || 0),
        emptyCollected: newBal ? (newBal['47.5kg']?.emptyCollected || 0) : (currentBal['47.5kg']?.emptyCollected || 0),
        stock: newStock ? (newStock['47.5kg'] || {withCustomer:0, collected:0}) : (currentBal['47.5kg']?.stock || {withCustomer:0, collected:0})
      }
    };
  }

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

export async function updateAllCustomersWithNewMarketPrices(newMarketPrices, customers, oldMarketPrices = null) {
  const updatedCustomers = [];
  const oldMarket = oldMarketPrices || DEFAULT_MARKET_PRICES;

  for (const c of customers) {
    const custDiscounts = c.discounts || c.prices?.discounts || {};
    const newPrices = {};
    const newCustDiscounts = {};

    CYLINDER_TYPES.forEach(type => {
      const newMkt = Number(newMarketPrices[type]) || 0;
      let discountPct = custDiscounts[type];

      // If no stored discount %, determine from old price vs old market price
      if (discountPct === undefined || discountPct === null) {
        const oldPrice = Number(c.prices?.[type]) || 0;
        const oldMktVal = Number(oldMarket[type]) || 0;
        if (oldPrice > 0 && oldMktVal > 0 && oldPrice < oldMktVal) {
          discountPct = Number((((oldMktVal - oldPrice) / oldMktVal) * 100).toFixed(2));
        } else {
          discountPct = 0;
        }
      }

      discountPct = Math.max(0, Math.min(100, Number(discountPct) || 0));
      newCustDiscounts[type] = discountPct;

      if (discountPct > 0) {
        newPrices[type] = Math.max(0, Math.round(newMkt * (1 - discountPct / 100)));
      } else {
        newPrices[type] = newMkt;
      }
    });

    try {
      const patched = await patchCustomer(c.id, {
        prices: {
          ...newPrices,
          discounts: newCustDiscounts,
        },
        discounts: newCustDiscounts,
      });
      updatedCustomers.push(patched);
    } catch (err) {
      console.error(`Failed to auto-update prices for customer ${c.name} (${c.id}):`, err);
      updatedCustomers.push({
        ...c,
        prices: { ...newPrices, discounts: newCustDiscounts },
        discounts: newCustDiscounts,
      });
    }
  }
  return updatedCustomers;
}

function mapCustomerFromDB(row) {
  const bal = row.bottle_balance || {};
  const rawPrices = row.prices || {};
  const discounts = rawPrices.discounts || { '5kg': 0, '19kg': 0, '47.5kg': 0 };

  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    address: row.address || '',
    type: row.type || 'Domestic',
    prices: {
      '5kg': Number(rawPrices['5kg']) || 450,
      '19kg': Number(rawPrices['19kg']) || 950,
      '47.5kg': Number(rawPrices['47.5kg']) || 2200,
      discounts: discounts,
    },
    discounts: discounts,
    bottleBalance: {
      '5kg': { filledGiven: bal['5kg']?.filledGiven || 0, emptyCollected: bal['5kg']?.emptyCollected || 0 },
      '19kg': { filledGiven: bal['19kg']?.filledGiven || 0, emptyCollected: bal['19kg']?.emptyCollected || 0 },
      '47.5kg': { filledGiven: bal['47.5kg']?.filledGiven || 0, emptyCollected: bal['47.5kg']?.emptyCollected || 0 },
    },
    emptyBottleStock: {
      '5kg': bal['5kg']?.stock || { withCustomer: 0, collected: 0 },
      '19kg': bal['19kg']?.stock || { withCustomer: 0, collected: 0 },
      '47.5kg': bal['47.5kg']?.stock || { withCustomer: 0, collected: 0 },
    },
  };
}

function mapCustomerToDB(customer) {
  const bal = customer.bottleBalance || {};
  const stock = customer.emptyBottleStock || {};
  const rawPrices = customer.prices || {};
  const discounts = customer.discounts || rawPrices.discounts || { '5kg': 0, '19kg': 0, '47.5kg': 0 };

  return {
    name: customer.name,
    phone: customer.phone,
    address: customer.address || '',
    type: customer.type || 'Domestic',
    prices: {
      '5kg': Number(rawPrices['5kg']) || 450,
      '19kg': Number(rawPrices['19kg']) || 950,
      '47.5kg': Number(rawPrices['47.5kg']) || 2200,
      discounts: discounts,
    },
    bottle_balance: {
      '5kg': { filledGiven: bal['5kg']?.filledGiven || 0, emptyCollected: bal['5kg']?.emptyCollected || 0, stock: stock['5kg'] || { withCustomer: 0, collected: 0 } },
      '19kg': { filledGiven: bal['19kg']?.filledGiven || 0, emptyCollected: bal['19kg']?.emptyCollected || 0, stock: stock['19kg'] || { withCustomer: 0, collected: 0 } },
      '47.5kg': { filledGiven: bal['47.5kg']?.filledGiven || 0, emptyCollected: bal['47.5kg']?.emptyCollected || 0, stock: stock['47.5kg'] || { withCustomer: 0, collected: 0 } },
    }
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
  if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
  if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
  if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
  if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
  if (updates.deliveryStatus !== undefined) dbUpdates.delivery_status = updates.deliveryStatus;
  if (updates.privateNotes !== undefined) dbUpdates.private_notes = updates.privateNotes;
  if (updates.paymentScreenshot !== undefined) dbUpdates.payment_screenshot = updates.paymentScreenshot;

  const isEB = updates.invoiceType === 'Empty Bottle' || updates.items?.some(i => i.itemType === 'empty' || i.isBottleOnly);
  
  if (updates.notes !== undefined || updates.invoiceType !== undefined) {
    let finalNotes = updates.notes !== undefined ? updates.notes : '';
    if (isEB && !finalNotes.includes('[Type: Empty Bottle]')) {
      finalNotes = `[Type: Empty Bottle] ${finalNotes}`.trim();
    } else if (!isEB && finalNotes.includes('[Type: Empty Bottle]')) {
      finalNotes = finalNotes.replace(/\[Type:\s*Empty Bottle\]\s*/gi, '').trim();
    }
    dbUpdates.notes = finalNotes;
  }

  if (updates.items !== undefined) {
    dbUpdates.items = updates.items.map(item => ({
      ...item,
      itemType: isEB ? 'empty' : (item.itemType || 'filled'),
      isBottleOnly: isEB || Boolean(item.isBottleOnly),
    }));
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

export async function removeInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapInvoiceFromDB(row) {
  const rawNotes = row.notes || '';
  const isEB = rawNotes.includes('[Type: Empty Bottle]') ||
               Boolean(row.items && row.items.some(i => i.itemType === 'empty' || i.isBottleOnly)) ||
               row.invoice_type === 'Empty Bottle';

  const cleanNotes = rawNotes.replace(/\[Type:\s*Empty Bottle\]\s*/gi, '').trim();

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceType: isEB ? 'Empty Bottle' : 'Standard',
    date: row.date,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address || '',
    items: row.items || [],
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    deliveryStatus: row.delivery_status || (isEB ? 'Collected' : 'Pending'),
    notes: cleanNotes,
    privateNotes: row.private_notes || '',
    paymentScreenshot: row.payment_screenshot || '',
  };
}

function mapInvoiceToDB(invoice) {
  const isEB = invoice.invoiceType === 'Empty Bottle' || invoice.items?.some(i => i.itemType === 'empty' || i.isBottleOnly);
  let finalNotes = invoice.notes || '';
  if (isEB && !finalNotes.includes('[Type: Empty Bottle]')) {
    finalNotes = `[Type: Empty Bottle] ${finalNotes}`.trim();
  } else if (!isEB && finalNotes.includes('[Type: Empty Bottle]')) {
    finalNotes = finalNotes.replace(/\[Type:\s*Empty Bottle\]\s*/gi, '').trim();
  }

  const preparedItems = (invoice.items || []).map(item => ({
    ...item,
    itemType: isEB ? 'empty' : (item.itemType || 'filled'),
    isBottleOnly: isEB || Boolean(item.isBottleOnly),
  }));

  return {
    invoice_number: invoice.invoiceNumber,
    date: invoice.date,
    customer_id: invoice.customerId,
    customer_name: invoice.customerName,
    customer_phone: invoice.customerPhone,
    customer_address: invoice.customerAddress || '',
    items: preparedItems,
    total_amount: Number(invoice.totalAmount) || 0,
    paid_amount: Number(invoice.paidAmount) || 0,
    payment_mode: invoice.paymentMode || 'Cash',
    payment_status: invoice.paymentStatus || 'Unpaid',
    delivery_status: invoice.deliveryStatus || (isEB ? 'Collected' : 'Pending'),
    notes: finalNotes,
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

// ==================== PERSONAL NOTES ====================

const LOCAL_NOTES_KEY = 'jig_personal_notes';

export async function fetchNotes() {
  try {
    const { data, error } = await supabase
      .from('personal_notes')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data) {
      const notes = data.map(mapNoteFromDB);
      try {
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
      } catch (_e) {}
      return notes;
    }
  } catch (err) {
    console.warn('Supabase fetchNotes error, falling back to local storage:', err);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(LOCAL_NOTES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('LocalStorage notes read error:', e);
  }
  return [];
}

export async function insertNote(note) {
  const dbNote = {
    date: note.date,
    title: note.title,
    content: note.content,
    attachments: note.attachments || [],
  };

  let localNotes = [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    if (raw) localNotes = JSON.parse(raw);
  } catch (_e) {}

  try {
    const { data, error } = await supabase
      .from('personal_notes')
      .insert(dbNote)
      .select()
      .single();

    if (!error && data) {
      const created = mapNoteFromDB(data);
      localNotes = [created, ...localNotes.filter(n => n.id !== created.id)];
      try {
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
      } catch (_e) {}
      return created;
    }
  } catch (err) {
    console.warn('Supabase insertNote error, saving locally:', err);
  }

  // Local fallback save
  const createdLocal = {
    ...dbNote,
    id: 'note_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localNotes = [createdLocal, ...localNotes];
  try {
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
  } catch (_e) {}
  return createdLocal;
}

export async function patchNote(id, updates) {
  const dbUpdates = {};
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
  dbUpdates.updated_at = new Date().toISOString();

  let localNotes = [];
  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    if (raw) localNotes = JSON.parse(raw);
  } catch (_e) {}

  try {
    const { data, error } = await supabase
      .from('personal_notes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const updated = mapNoteFromDB(data);
      localNotes = localNotes.map(n => n.id === id ? updated : n);
      try {
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
      } catch (_e) {}
      return updated;
    }
  } catch (err) {
    console.warn('Supabase patchNote error, updating locally:', err);
  }

  // Local fallback update
  localNotes = localNotes.map(n => {
    if (n.id === id) {
      return { ...n, ...updates, updatedAt: new Date().toISOString() };
    }
    return n;
  });
  try {
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
  } catch (_e) {}
  return localNotes.find(n => n.id === id) || { id, ...updates };
}

export async function removeNote(id) {
  // First try cleanup from storage
  try {
    const { data: note } = await supabase
      .from('personal_notes')
      .select('attachments')
      .eq('id', id)
      .single();

    if (note?.attachments?.length > 0) {
      const paths = note.attachments.map(a => a.storagePath).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('note-attachments').remove(paths);
      }
    }
  } catch (_e) {}

  try {
    await supabase.from('personal_notes').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase removeNote error:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    if (raw) {
      const filtered = JSON.parse(raw).filter(n => n.id !== id);
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(filtered));
    }
  } catch (_e) {}
}

function mapNoteFromDB(row) {
  return {
    id: row.id,
    date: row.date,
    title: row.title || '',
    content: row.content || '',
    attachments: row.attachments || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==================== FILE ATTACHMENTS ====================

export async function uploadNoteAttachment(file) {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${timestamp}_${safeName}`;

  try {
    const { error } = await supabase.storage
      .from('note-attachments')
      .upload(filePath, file);

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('note-attachments')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: filePath,
        url: urlData.publicUrl,
      };
    }
  } catch (err) {
    console.warn('Supabase storage upload error, falling back to data URL:', err);
  }

  // Fallback to Base64 Data URL so user can still preview & download locally
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath: null,
        url: reader.result,
      });
    };
    reader.onerror = (e) => reject(new Error('File reading failed: ' + e));
    reader.readAsDataURL(file);
  });
}

export async function deleteNoteAttachment(storagePath) {
  if (!storagePath) return;
  try {
    await supabase.storage.from('note-attachments').remove([storagePath]);
  } catch (err) {
    console.warn('Supabase storage delete error:', err);
  }
}

// ==================== RESET ALL DATA ====================

export async function resetAllData() {
  // Delete all rows from every table that exists in database
  const tables = ['invoices', 'expenses', 'refill_trips', 'personal_notes', 'customers'];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error && error.code !== 'PGRST205') {
        console.warn(`Warning clearing ${table}:`, error.message);
      }
    } catch (e) {
      console.warn(`Exception clearing ${table}:`, e);
    }
  }

  // Reset stock counts to 0 in Supabase
  try {
    const { data: stockRows } = await supabase.from('stock').select('id');
    if (stockRows) {
      for (const row of stockRows) {
        await supabase
          .from('stock')
          .update({ filled_count: 0, empty_count: 0 })
          .eq('id', row.id);
      }
    }
  } catch (e) {
    console.warn('Exception resetting stock in DB:', e);
  }

  // Clean up all files from note-attachments storage bucket
  try {
    const { data: files } = await supabase.storage
      .from('note-attachments')
      .list('', { limit: 1000 });
    if (files && files.length > 0) {
      const paths = files.map(f => f.name);
      await supabase.storage.from('note-attachments').remove(paths);
    }
  } catch (_e) {
    console.warn('Could not clean storage:', _e);
  }

  // Clean up all local storage data backups
  try {
    localStorage.removeItem(LOCAL_NOTES_KEY);
    localStorage.removeItem('jig_market_prices');
    localStorage.removeItem('jig_market_prices_meta');
  } catch (_e) {}
}

// ==================== APP USERS & AUTH ====================

const LOCAL_USERS_KEY = 'jig_app_users';

export const SUPER_ADMIN_USER = {
  id: 'super-admin-01',
  username: 'admin',
  email: 'jaydeepindian01@gmail.com',
  name: 'Super Admin',
  role: 'admin',
  permissions: {
    dashboard: 'full',
    customers: 'edit',
    invoices: 'edit',
    stock: 'edit',
    refill: 'edit',
    reports: 'view',
    expenses: 'edit',
    notes: 'edit',
    users: 'edit',
  },
  status: 'active',
};

export async function fetchAppUsers() {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const users = data.map(mapUserFromDB);
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      } catch (_e) {}
      return users;
    }
  } catch (err) {
    console.warn('Supabase fetchAppUsers error, using fallback:', err);
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(LOCAL_USERS_KEY);
    if (local) return JSON.parse(local);
  } catch (_e) {}

  return [];
}

export async function insertAppUser(user) {
  const newUser = {
    username: user.username.trim().toLowerCase(),
    password: user.password,
    name: user.name || user.username,
    role: user.role || 'staff',
    permissions: user.permissions || {},
    status: user.status || 'active',
  };

  // Local storage backup
  let localUsers = [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) localUsers = JSON.parse(raw);
  } catch (_e) {}

  try {
    const { data, error } = await supabase
      .from('app_users')
      .insert(newUser)
      .select()
      .single();

    if (!error && data) {
      const created = mapUserFromDB(data);
      localUsers = [created, ...localUsers.filter(u => u.id !== created.id)];
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      } catch (_e) {}
      return created;
    }
  } catch (err) {
    console.warn('Supabase insertAppUser error, saving locally:', err);
  }

  // Fallback local save
  const createdLocal = {
    ...newUser,
    id: 'user_' + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localUsers = [createdLocal, ...localUsers];
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
  } catch (_e) {}
  return createdLocal;
}

export async function patchAppUser(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.password !== undefined && updates.password) dbUpdates.password = updates.password;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  dbUpdates.updated_at = new Date().toISOString();

  // Local storage update
  let localUsers = [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) localUsers = JSON.parse(raw);
  } catch (_e) {}

  try {
    const { data, error } = await supabase
      .from('app_users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const updated = mapUserFromDB(data);
      localUsers = localUsers.map(u => u.id === id ? updated : u);
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      } catch (_e) {}
      return updated;
    }
  } catch (err) {
    console.warn('Supabase patchAppUser error, updating locally:', err);
  }

  // Fallback local
  localUsers = localUsers.map(u => {
    if (u.id === id) {
      return { ...u, ...updates, updatedAt: new Date().toISOString() };
    }
    return u;
  });
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
  } catch (_e) {}
  return localUsers.find(u => u.id === id);
}

export async function removeAppUser(id) {
  try {
    await supabase.from('app_users').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase removeAppUser error:', err);
  }

  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw).filter(u => u.id !== id);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
  } catch (_e) {}
}

export async function authenticateUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPw = (password || '').trim();

  // 1. Check Super Admin
  if (
    (cleanId === 'jaydeepindian01@gmail.com' || cleanId === 'admin') &&
    cleanPw === 'Jaydeep@1234'
  ) {
    return SUPER_ADMIN_USER;
  }

  // 2. Check Database users
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', cleanId)
      .eq('password', cleanPw)
      .single();

    if (!error && data) {
      if (data.status === 'inactive') {
        throw new Error('ACCOUNT_INACTIVE');
      }
      return mapUserFromDB(data);
    }
  } catch (err) {
    if (err.message === 'ACCOUNT_INACTIVE') throw err;
    console.warn('Supabase authenticateUser error, checking local users:', err);
  }

  // 3. Check Local Storage fallback
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw);
      const match = users.find(u => u.username?.toLowerCase() === cleanId && u.password === cleanPw);
      if (match) {
        if (match.status === 'inactive') {
          throw new Error('ACCOUNT_INACTIVE');
        }
        return match;
      }
    }
  } catch (err) {
    if (err.message === 'ACCOUNT_INACTIVE') throw err;
  }

  return null;
}

function mapUserFromDB(row) {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name || row.username,
    role: row.role || 'staff',
    permissions: row.permissions || {},
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

