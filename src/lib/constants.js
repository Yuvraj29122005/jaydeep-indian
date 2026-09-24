// Shared constants for Jaydeep Indian Gas Agency

export const CYLINDER_TYPES = ['5kg', '19kg', '47.5kg'];

export const EXPENSE_TYPES = ['Fuel', 'Salary', 'Office Supplies', 'Utilities', 'Maintenance', 'Miscellaneous'];

export const CUSTOMER_TYPES = ['Domestic', 'Commercial', 'Hotel', 'Industrial'];

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Credit', 'Cheque'];

export const INVOICE_TYPES = ['Standard', 'Empty Bottle'];

export const defaultBottleBalance = () => ({
  '5kg': { filledGiven: 0, emptyCollected: 0 },
  '19kg': { filledGiven: 0, emptyCollected: 0 },
  '47.5kg': { filledGiven: 0, emptyCollected: 0 },
});

export const defaultEmptyStock = () => ({
  '5kg': { withCustomer: 0, collected: 0 },
  '19kg': { withCustomer: 0, collected: 0 },
  '47.5kg': { withCustomer: 0, collected: 0 },
});

export const DEFAULT_MARKET_PRICES = {
  '5kg': 500,
  '19kg': 1000,
  '47.5kg': 2300,
};

export const defaultCustomerDiscounts = () => ({
  '5kg': 0,
  '19kg': 0,
  '47.5kg': 0,
});

export const DEFAULT_AGENCY_SETTINGS = {
  agencyName: 'Jaydeep Indian Gas Agency',
  companyName: 'Jaydeep Indian Gas Agency',
  tagline: 'Authorized Indane LPG Distributor',
  gstin: '24ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  phone: '9876543210',
  alternatePhone: '9876543211',
  email: 'jaydeepindian01@gmail.com',
  website: '',
  address: 'Plot No. 12, GIDC Industrial Estate, Sachin',
  city: 'Surat',
  state: 'Gujarat',
  pincode: '394230',
  bankName: 'State Bank of India',
  accountHolder: 'Jaydeep Indian Gas Agency',
  accountNumber: '123456789012',
  ifscCode: 'SBIN0001234',
  branch: 'Sachin GIDC Branch',
  upiId: 'jaydeepgas@upi',
  invoicePrefix: 'JIG',
  emptyBottlePrefix: 'EB',
  invoiceTerms: `1. Goods once sold will not be taken back.
2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.
3. Check cylinder seal and weight at the time of delivery.
4. Subject to Surat jurisdiction only.`,
  invoiceFooterNote: 'Thank you for your business! For emergency leak support, contact helpline immediately.',
  signatoryTitle: 'Authorized Signatory',
  updatedAt: null,
  updatedBy: 'Admin'
};

