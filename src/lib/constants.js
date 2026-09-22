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
