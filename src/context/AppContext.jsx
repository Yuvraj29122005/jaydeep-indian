import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as db from '../lib/database';
import { CYLINDER_TYPES, defaultBottleBalance, defaultEmptyStock, DEFAULT_MARKET_PRICES, DEFAULT_AGENCY_SETTINGS } from '../lib/constants';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth state — user & role management
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jig_current_user');
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    const loggedIn = localStorage.getItem('jig_logged_in') === 'true';
    return loggedIn ? db.SUPER_ADMIN_USER : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('jig_logged_in') === 'true';
  });

  // Data states
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refillTrips, setRefillTrips] = useState([]);
  const [notes, setNotes] = useState([]);
  const [marketPrices, setMarketPrices] = useState(DEFAULT_MARKET_PRICES);
  const [marketPricesMeta, setMarketPricesMeta] = useState({ updatedAt: null, updatedBy: 'Admin' });
  const [agencySettings, setAgencySettings] = useState(() => {
    try {
      const saved = localStorage.getItem('jig_agency_settings');
      if (saved) return { ...DEFAULT_AGENCY_SETTINGS, ...JSON.parse(saved) };
    } catch (_e) {}
    return DEFAULT_AGENCY_SETTINGS;
  });
  const [agencySettingsMeta, setAgencySettingsMeta] = useState({ syncedWithSupabase: false });
  const [appUsers, setAppUsers] = useState([]);

  // Data loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== GLOBAL PROCESS LOADING MODAL STATE ====================
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('Please wait...');
  const [globalLoadingSubtext, setGlobalLoadingSubtext] = useState('');
  const loadingCountRef = useRef(0);

  const showLoading = useCallback((message = 'Please wait...', subtext = '') => {
    loadingCountRef.current += 1;
    setGlobalLoadingMessage(message);
    setGlobalLoadingSubtext(subtext);
    setGlobalLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    if (loadingCountRef.current === 0) {
      setGlobalLoading(false);
    }
  }, []);

  const forceHideLoading = useCallback(() => {
    loadingCountRef.current = 0;
    setGlobalLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFn, message = 'Please wait...', subtext = '') => {
    showLoading(message, subtext);
    try {
      return await asyncFn();
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  // Window bridge for direct access anywhere in scripts/components
  useEffect(() => {
    window.showAppLoading = showLoading;
    window.hideAppLoading = hideLoading;
    window.forceHideAppLoading = forceHideLoading;
    return () => {
      delete window.showAppLoading;
      delete window.hideAppLoading;
      delete window.forceHideAppLoading;
    };
  }, [showLoading, hideLoading, forceHideLoading]);

  // Persist login state
  useEffect(() => {
    localStorage.setItem('jig_logged_in', isLoggedIn);
    if (!isLoggedIn) {
      localStorage.removeItem('jig_current_user');
    }
  }, [isLoggedIn]);

  // Load all data from Supabase on mount (if logged in)
  const loadAllData = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    showLoading('Loading Jaydeep Indian Gas...', 'Connecting to database and fetching records');
    setError(null);
    try {
      const [
        customersData,
        stockData,
        invoicesData,
        expensesData,
        refillTripsData,
        notesData,
        marketData,
        agencyData,
        usersData,
      ] = await Promise.all([
        db.fetchCustomers().catch(err => { console.warn('Customers fetch fallback:', err); return []; }),
        db.fetchStock().catch(err => { console.warn('Stock fetch fallback:', err); return []; }),
        db.fetchInvoices().catch(err => { console.warn('Invoices fetch fallback:', err); return []; }),
        db.fetchExpenses().catch(err => { console.warn('Expenses fetch fallback:', err); return []; }),
        db.fetchRefillTrips().catch(err => { console.warn('Refill trips fetch fallback:', err); return []; }),
        db.fetchNotes().catch(err => { console.warn('Notes fetch fallback:', err); return []; }),
        db.fetchMarketPrices().catch(err => { console.warn('Market prices fetch fallback:', err); return null; }),
        db.fetchAgencySettings().catch(err => { console.warn('Agency settings fetch fallback:', err); return null; }),
        db.fetchAppUsers().catch(err => { console.warn('App users fetch fallback:', err); return []; }),
      ]);
      setCustomers(customersData || []);
      setStock(stockData || []);
      setInvoices(invoicesData || []);
      setExpenses(expensesData || []);
      setRefillTrips(refillTripsData || []);
      setNotes(notesData || []);
      if (marketData?.prices) {
        setMarketPrices(marketData.prices);
        setMarketPricesMeta(marketData.meta || { updatedAt: null, updatedBy: 'Admin' });
      }
      if (agencyData?.settings) {
        setAgencySettings(agencyData.settings);
        setAgencySettingsMeta({ syncedWithSupabase: agencyData.syncedWithSupabase });
      }
      setAppUsers(usersData || []);
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [isLoggedIn, showLoading, hideLoading]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================== AUTH & PERMISSIONS ====================

  const login = async (identifier, password) => {
    return withLoading(async () => {
      try {
        const user = await db.authenticateUser(identifier, password);
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          localStorage.setItem('jig_logged_in', 'true');
          localStorage.setItem('jig_current_user', JSON.stringify(user));
          return { success: true, user };
        }
        return { success: false, error: 'Invalid username or password.' };
      } catch (err) {
        if (err.message === 'ACCOUNT_INACTIVE') {
          return { success: false, error: 'This account has been deactivated by the admin.' };
        }
        return { success: false, error: err.message || 'Login failed.' };
      }
    }, 'Verifying Credentials...', 'Signing in to admin portal');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('jig_logged_in');
    localStorage.removeItem('jig_current_user');
  };

  const hasModuleAccess = (module) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perm = currentUser.permissions?.[module];
    return perm === 'view' || perm === 'edit' || perm === 'full';
  };

  const canEditModule = (module) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const perm = currentUser.permissions?.[module];
    return perm === 'edit' || perm === 'full';
  };

  // ==================== USER MANAGEMENT ====================

  const createAppUser = async (userData) => {
    return withLoading(async () => {
      try {
        const created = await db.insertAppUser(userData);
        setAppUsers(prev => [created, ...prev.filter(u => u.id !== created.id)]);
        return created;
      } catch (err) {
        console.error('Failed to create user:', err);
        throw err;
      }
    }, 'Creating User...', 'Saving user credentials & role');
  };

  const updateAppUser = async (id, updates) => {
    return withLoading(async () => {
      try {
        const updated = await db.patchAppUser(id, updates);
        setAppUsers(prev => prev.map(u => u.id === id ? updated : u));
        if (currentUser?.id === id) {
          const newCur = { ...currentUser, ...updated };
          setCurrentUser(newCur);
          localStorage.setItem('jig_current_user', JSON.stringify(newCur));
        }
        return updated;
      } catch (err) {
        console.error('Failed to update user:', err);
        throw err;
      }
    }, 'Updating User...', 'Applying account changes');
  };

  const deleteAppUser = async (id) => {
    return withLoading(async () => {
      try {
        await db.removeAppUser(id);
        setAppUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        console.error('Failed to delete user:', err);
        throw err;
      }
    }, 'Deleting User...', 'Removing user from system');
  };

  // ==================== CUSTOMERS ====================

  const addCustomer = async (customer) => {
    return withLoading(async () => {
      try {
        const newCust = await db.insertCustomer({
          ...customer,
          bottleBalance: customer.bottleBalance || defaultBottleBalance(),
        });
        setCustomers(prev => [...prev, newCust]);
        return newCust;
      } catch (err) {
        console.error('Failed to add customer:', err);
        throw err;
      }
    }, 'Saving Customer...', 'Adding new customer to database');
  };

  const updateCustomer = async (id, updated) => {
    return withLoading(async () => {
      try {
        const updatedCust = await db.patchCustomer(id, updated);
        setCustomers(prev => prev.map(c => c.id === id ? updatedCust : c));
      } catch (err) {
        console.error('Failed to update customer:', err);
        throw err;
      }
    }, 'Updating Customer...', 'Saving customer changes');
  };

  const deleteCustomer = async (id) => {
    return withLoading(async () => {
      try {
        await db.removeCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error('Failed to delete customer:', err);
        throw err;
      }
    }, 'Deleting Customer...', 'Removing record from database');
  };

  const defaultBottleBalanceHelper = () => ({
    '5kg': { filledGiven: 0, emptyCollected: 0 },
    '19kg': { filledGiven: 0, emptyCollected: 0 },
    '47.5kg': { filledGiven: 0, emptyCollected: 0 },
  });

  const applyInvoiceBottleChangesToCustomer = async (customerId, deltas) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const bal = JSON.parse(JSON.stringify(customer.bottleBalance || defaultBottleBalanceHelper()));
    const stock = JSON.parse(JSON.stringify(customer.emptyBottleStock || defaultEmptyStock()));

    CYLINDER_TYPES.forEach(t => {
      const d = deltas[t];
      if (d) {
        if (!bal[t]) bal[t] = { filledGiven: 0, emptyCollected: 0 };
        if (!stock[t]) stock[t] = { withCustomer: 0, collected: 0 };

        bal[t].filledGiven = Math.max(0, (bal[t].filledGiven || 0) + (d.filledDelta || 0));
        bal[t].emptyCollected = Math.max(0, (bal[t].emptyCollected || 0) + (d.emptyCollectedDelta || 0));

        stock[t].withCustomer = Math.max(0, (stock[t].withCustomer || 0) + (d.withCustomerDelta || 0));
        stock[t].collected = Math.max(0, (stock[t].collected || 0) + (d.emptyCollectedDelta || 0));
      }
    });

    try {
      const updatedCust = await db.patchCustomer(customerId, {
        bottleBalance: bal,
        emptyBottleStock: stock,
      });
      setCustomers(prev => prev.map(c => c.id === customerId ? updatedCust : c));
      return updatedCust;
    } catch (err) {
      console.error('Failed to sync customer bottle status:', err);
    }
  };

  const updateBottleBalance = async (customerId, cylinderType, filledGivenDelta, emptyCollectedDelta) => {
    await applyInvoiceBottleChangesToCustomer(customerId, {
      [cylinderType]: {
        filledDelta: filledGivenDelta,
        withCustomerDelta: filledGivenDelta,
        emptyCollectedDelta: emptyCollectedDelta,
      }
    });
  };

  const setBottleBalanceDirect = async (customerId, newBalance) => {
    try {
      const updatedCustomer = await db.patchCustomer(customerId, { bottleBalance: newBalance });
      setCustomers(prev => prev.map(c =>
        c.id === customerId ? updatedCustomer : c
      ));
    } catch (err) {
      console.error('Failed to set bottle balance:', err);
    }
  };

  // ==================== EMPTY BOTTLE STOCK ====================

  const updateEmptyBottleStock = async (customerId, newStock) => {
    return withLoading(async () => {
      try {
        const updatedCustomer = await db.patchCustomer(customerId, { emptyBottleStock: newStock });
        setCustomers(prev => prev.map(c =>
          c.id === customerId ? updatedCustomer : c
        ));
        return updatedCustomer;
      } catch (err) {
        console.error('Failed to update empty bottle stock:', err);
        throw err;
      }
    }, 'Updating Empty Stock...', 'Saving customer bottle balance');
  };

  // ==================== STOCK ====================

  const updateStock = async (cylinderType, filledDelta, emptyDelta) => {
    let newFilled = 0;
    let newEmpty = 0;
    setStock(prev => prev.map(st => {
      if (st.cylinderType === cylinderType) {
        newFilled = Math.max(0, (st.filledCount || 0) + Number(filledDelta || 0));
        newEmpty = Math.max(0, (st.emptyCount || 0) + Number(emptyDelta || 0));
        return { ...st, filledCount: newFilled, emptyCount: newEmpty };
      }
      return st;
    }));

    try {
      await db.patchStock(cylinderType, { filledCount: newFilled, emptyCount: newEmpty });
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const updateStockBatch = async (varietyDeltas) => {
    const updatedStock = {};
    setStock(prev => prev.map(st => {
      const d = varietyDeltas[st.cylinderType];
      if (d) {
        const newFilled = Math.max(0, (st.filledCount || 0) + Number(d.filledDelta || 0));
        const newEmpty = Math.max(0, (st.emptyCount || 0) + Number(d.emptyDelta || 0));
        updatedStock[st.cylinderType] = { filledCount: newFilled, emptyCount: newEmpty };
        return { ...st, filledCount: newFilled, emptyCount: newEmpty };
      }
      return st;
    }));

    for (const [cylType, counts] of Object.entries(updatedStock)) {
      try {
        await db.patchStock(cylType, counts);
      } catch (err) {
        console.error(`Failed to patch stock for ${cylType}:`, err);
      }
    }
  };

  const addStockManual = async (cylinderType, filledAdd, emptyAdd) => {
    return withLoading(async () => {
      const s = stock.find(st => st.cylinderType === cylinderType);
      if (!s) return;

      const newFilled = s.filledCount + Number(filledAdd);
      const newEmpty = s.emptyCount + Number(emptyAdd);

      try {
        await db.patchStock(cylinderType, { filledCount: newFilled, emptyCount: newEmpty });
        setStock(prev => prev.map(st =>
          st.cylinderType === cylinderType
            ? { ...st, filledCount: newFilled, emptyCount: newEmpty }
            : st
        ));
      } catch (err) {
        console.error('Failed to add stock:', err);
      }
    }, 'Updating Warehouse Stock...', 'Adjusting cylinder quantities');
  };

  const getStockByType = (type) => stock.find(s => s.cylinderType === type) || { filledCount: 0, emptyCount: 0 };

  // ==================== INVOICES ====================

  const createInvoice = async (invoiceData) => {
    return withLoading(async () => {
      try {
        const isEB = invoiceData.invoiceType === 'Empty Bottle';
        const defaultPrefix = isEB ? 'EB' : 'JIG';
        const invoiceNumber = invoiceData.invoiceNumber || `${defaultPrefix}-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
        
        const newInvoice = await db.insertInvoice({
          ...invoiceData,
          invoiceNumber,
        });

        setInvoices(prev => [...prev, newInvoice]);

        // 1. Calculate and update warehouse agency stock INSTANTLY variety-wise for ALL invoices
        if (invoiceData.items && invoiceData.items.length > 0) {
          const varietyStockDeltas = {};
          CYLINDER_TYPES.forEach(t => {
            varietyStockDeltas[t] = { filledDelta: 0, emptyDelta: 0 };
          });

          const customerDeltas = {};
          const ncBottleDeltas = {};

          for (const item of invoiceData.items) {
            const type = item.cylinderType;
            if (!varietyStockDeltas[type]) {
              varietyStockDeltas[type] = { filledDelta: 0, emptyDelta: 0 };
            }
            const isItemEmpty = isEB || item.itemType === 'empty' || item.isBottleOnly;
            const isNC = Boolean(item.isNC);

            if (isNC) {
              const filledQty = Number(item.qty) || 0;
              varietyStockDeltas[type].filledDelta -= filledQty;

              if (!ncBottleDeltas[type]) ncBottleDeltas[type] = 0;
              ncBottleDeltas[type] += filledQty;

              if (!customerDeltas[type]) {
                customerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              customerDeltas[type].filledDelta += filledQty;
            } else {
              const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
              const emptyGain = isItemEmpty 
                ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
                : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

              varietyStockDeltas[type].filledDelta -= filledQty;
              varietyStockDeltas[type].emptyDelta += emptyGain;

              if (!customerDeltas[type]) {
                customerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              customerDeltas[type].filledDelta += filledQty;
              customerDeltas[type].withCustomerDelta += filledQty;
              customerDeltas[type].emptyCollectedDelta += emptyGain;
            }
          }

          // Instantly update warehouse stock variety-wise!
          await updateStockBatch(varietyStockDeltas);

          // Update customer record if saved customer selected
          if (invoiceData.customerId && invoiceData.customerId !== 'manual') {
            await applyInvoiceBottleChangesToCustomer(invoiceData.customerId, customerDeltas);

            if (Object.keys(ncBottleDeltas).length > 0) {
              const customer = customers.find(c => c.id === invoiceData.customerId);
              if (customer) {
                const currentNC = { ...(customer.ncBottles || {}) };
                CYLINDER_TYPES.forEach(t => {
                  if (ncBottleDeltas[t]) {
                    currentNC[t] = (currentNC[t] || 0) + ncBottleDeltas[t];
                  }
                });
                await db.patchCustomer(invoiceData.customerId, { ncBottles: currentNC });
                setCustomers(prev => prev.map(c => c.id === invoiceData.customerId ? { ...c, ncBottles: currentNC } : c));
              }
            }
          }
        }

        return newInvoice;
      } catch (err) {
        console.error('Failed to create invoice:', err);
        throw err;
      }
    }, 'Generating & Saving Invoice...', 'Updating inventory and customer accounts');
  };

  const updateInvoice = async (id, updates) => {
    return withLoading(async () => {
      try {
        const updatedInv = await db.patchInvoice(id, updates);
        setInvoices(prev => prev.map(inv => inv.id === id ? updatedInv : inv));
      } catch (err) {
        console.error('Failed to update invoice:', err);
      }
    }, 'Updating Invoice...', 'Saving changes');
  };

  const editInvoiceFull = async (id, updates) => {
    return withLoading(async () => {
      const oldInv = invoices.find(i => i.id === id);
      if (!oldInv) return;

      try {
        const oldIsEB = oldInv.invoiceType === 'Empty Bottle';
        const newIsEB = updates.invoiceType === 'Empty Bottle' || (updates.invoiceType === undefined && oldIsEB);

        const varietyStockDeltas = {};
        CYLINDER_TYPES.forEach(t => {
          varietyStockDeltas[t] = { filledDelta: 0, emptyDelta: 0 };
        });

        // 1. Revert old items from warehouse stock and old customer
        if (oldInv.items && oldInv.items.length > 0) {
          const revertCustomerDeltas = {};
          const revertNCDeltas = {};

          for (const item of oldInv.items) {
            const type = item.cylinderType;
            if (!varietyStockDeltas[type]) varietyStockDeltas[type] = { filledDelta: 0, emptyDelta: 0 };
            const isItemEmpty = oldIsEB || item.itemType === 'empty' || item.isBottleOnly;
            const isNC = Boolean(item.isNC);

            if (isNC) {
              const filledQty = Number(item.qty) || 0;
              varietyStockDeltas[type].filledDelta += filledQty;

              if (!revertNCDeltas[type]) revertNCDeltas[type] = 0;
              revertNCDeltas[type] += filledQty;

              if (!revertCustomerDeltas[type]) {
                revertCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              revertCustomerDeltas[type].filledDelta -= filledQty;
            } else {
              const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
              const emptyGain = isItemEmpty 
                ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
                : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

              varietyStockDeltas[type].filledDelta += filledQty;
              varietyStockDeltas[type].emptyDelta -= emptyGain;

              if (!revertCustomerDeltas[type]) {
                revertCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              revertCustomerDeltas[type].filledDelta -= filledQty;
              revertCustomerDeltas[type].withCustomerDelta -= filledQty;
              revertCustomerDeltas[type].emptyCollectedDelta -= emptyGain;
            }
          }

          if (oldInv.customerId && oldInv.customerId !== 'manual') {
            await applyInvoiceBottleChangesToCustomer(oldInv.customerId, revertCustomerDeltas);
            if (Object.keys(revertNCDeltas).length > 0) {
              const customer = customers.find(c => c.id === oldInv.customerId);
              if (customer) {
                const currentNC = { ...(customer.ncBottles || {}) };
                CYLINDER_TYPES.forEach(t => {
                  if (revertNCDeltas[t]) {
                    currentNC[t] = Math.max(0, (currentNC[t] || 0) - revertNCDeltas[t]);
                  }
                });
                await db.patchCustomer(oldInv.customerId, { ncBottles: currentNC });
                setCustomers(prev => prev.map(c => c.id === oldInv.customerId ? { ...c, ncBottles: currentNC } : c));
              }
            }
          }
        }

        // 2. Apply new items to warehouse stock and new/updated customer
        const targetCustomerId = updates.customerId || oldInv.customerId;
        const targetItems = updates.items || oldInv.items;

        if (targetItems && targetItems.length > 0) {
          const applyCustomerDeltas = {};
          const applyNCDeltas = {};

          for (const item of targetItems) {
            const type = item.cylinderType;
            if (!varietyStockDeltas[type]) varietyStockDeltas[type] = { filledDelta: 0, emptyDelta: 0 };
            const isItemEmpty = newIsEB || item.itemType === 'empty' || item.isBottleOnly;
            const isNC = Boolean(item.isNC);

            if (isNC) {
              const filledQty = Number(item.qty) || 0;
              varietyStockDeltas[type].filledDelta -= filledQty;

              if (!applyNCDeltas[type]) applyNCDeltas[type] = 0;
              applyNCDeltas[type] += filledQty;

              if (!applyCustomerDeltas[type]) {
                applyCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              applyCustomerDeltas[type].filledDelta += filledQty;
            } else {
              const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
              const emptyGain = isItemEmpty 
                ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
                : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

              varietyStockDeltas[type].filledDelta -= filledQty;
              varietyStockDeltas[type].emptyDelta += emptyGain;

              if (!applyCustomerDeltas[type]) {
                applyCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              applyCustomerDeltas[type].filledDelta += filledQty;
              applyCustomerDeltas[type].withCustomerDelta += filledQty;
              applyCustomerDeltas[type].emptyCollectedDelta += emptyGain;
            }
          }

          if (targetCustomerId && targetCustomerId !== 'manual') {
            await applyInvoiceBottleChangesToCustomer(targetCustomerId, applyCustomerDeltas);
            if (Object.keys(applyNCDeltas).length > 0) {
              const customer = customers.find(c => c.id === targetCustomerId);
              if (customer) {
                const currentNC = { ...(customer.ncBottles || {}) };
                CYLINDER_TYPES.forEach(t => {
                  if (applyNCDeltas[t]) {
                    currentNC[t] = (currentNC[t] || 0) + applyNCDeltas[t];
                  }
                });
                await db.patchCustomer(targetCustomerId, { ncBottles: currentNC });
                setCustomers(prev => prev.map(c => c.id === targetCustomerId ? { ...c, ncBottles: currentNC } : c));
              }
            }
          }
        }

        // Apply net stock deltas variety-wise
        await updateStockBatch(varietyStockDeltas);

        const updatedInv = await db.patchInvoice(id, updates);
        setInvoices(prev => prev.map(inv => inv.id === id ? updatedInv : inv));
        return updatedInv;
      } catch (err) {
        console.error('Failed to edit invoice:', err);
        throw err;
      }
    }, 'Updating Invoice...', 'Synchronizing inventory and customer accounts');
  };

  const deleteInvoice = async (id) => {
    return withLoading(async () => {
      const oldInv = invoices.find(i => i.id === id);
      if (!oldInv) return;

      try {
        const oldIsEB = oldInv.invoiceType === 'Empty Bottle';
        if (oldInv.items && oldInv.items.length > 0) {
          const varietyStockDeltas = {};
          CYLINDER_TYPES.forEach(t => {
            varietyStockDeltas[t] = { filledDelta: 0, emptyDelta: 0 };
          });
          const revertCustomerDeltas = {};
          const revertNCDeltas = {};

          for (const item of oldInv.items) {
            const type = item.cylinderType;
            if (!varietyStockDeltas[type]) varietyStockDeltas[type] = { filledDelta: 0, emptyDelta: 0 };
            const isItemEmpty = oldIsEB || item.itemType === 'empty' || item.isBottleOnly;
            const isNC = Boolean(item.isNC);

            if (isNC) {
              const filledQty = Number(item.qty) || 0;
              varietyStockDeltas[type].filledDelta += filledQty;

              if (!revertNCDeltas[type]) revertNCDeltas[type] = 0;
              revertNCDeltas[type] += filledQty;

              if (!revertCustomerDeltas[type]) {
                revertCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              revertCustomerDeltas[type].filledDelta -= filledQty;
            } else {
              const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
              const emptyGain = isItemEmpty 
                ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
                : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

              varietyStockDeltas[type].filledDelta += filledQty;
              varietyStockDeltas[type].emptyDelta -= emptyGain;

              if (!revertCustomerDeltas[type]) {
                revertCustomerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
              }
              revertCustomerDeltas[type].filledDelta -= filledQty;
              revertCustomerDeltas[type].withCustomerDelta -= filledQty;
              revertCustomerDeltas[type].emptyCollectedDelta -= emptyGain;
            }
          }

          // Restore stock
          await updateStockBatch(varietyStockDeltas);

          // Restore customer balance
          if (oldInv.customerId && oldInv.customerId !== 'manual') {
            await applyInvoiceBottleChangesToCustomer(oldInv.customerId, revertCustomerDeltas);
            if (Object.keys(revertNCDeltas).length > 0) {
              const customer = customers.find(c => c.id === oldInv.customerId);
              if (customer) {
                const currentNC = { ...(customer.ncBottles || {}) };
                CYLINDER_TYPES.forEach(t => {
                  if (revertNCDeltas[t]) {
                    currentNC[t] = Math.max(0, (currentNC[t] || 0) - revertNCDeltas[t]);
                  }
                });
                await db.patchCustomer(oldInv.customerId, { ncBottles: currentNC });
                setCustomers(prev => prev.map(c => c.id === oldInv.customerId ? { ...c, ncBottles: currentNC } : c));
              }
            }
          }
        }

        await db.removeInvoice(id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } catch (err) {
        console.error('Failed to delete invoice:', err);
        throw err;
      }
    }, 'Deleting Invoice...', 'Reverting stock & customer balances');
  };

  // ==================== EXPENSES ====================

  const addExpense = async (expenseData) => {
    return withLoading(async () => {
      try {
        const newExpense = await db.insertExpense(expenseData);
        setExpenses(prev => [...prev, newExpense]);
        return newExpense;
      } catch (err) {
        console.error('Failed to add expense:', err);
        throw err;
      }
    }, 'Saving Expense...', 'Recording expense transaction');
  };

  const updateExpense = async (id, updated) => {
    return withLoading(async () => {
      try {
        const updatedExp = await db.patchExpense(id, updated);
        setExpenses(prev => prev.map(e => e.id === id ? updatedExp : e));
      } catch (err) {
        console.error('Failed to update expense:', err);
      }
    }, 'Updating Expense...', 'Saving changes');
  };

  const deleteExpense = async (id) => {
    return withLoading(async () => {
      try {
        await db.removeExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error('Failed to delete expense:', err);
      }
    }, 'Deleting Expense...', 'Removing expense record');
  };

  // ==================== REFILL TRIPS ====================

  const sendForRefill = async (cylinderType, emptyCount) => {
    return withLoading(async () => {
      try {
        await updateStock(cylinderType, 0, -Number(emptyCount));
        const newTrip = await db.insertRefillTrip({
          cylinderType,
          emptySentCount: Number(emptyCount),
        });
        setRefillTrips(prev => [newTrip, ...prev]);
        return newTrip;
      } catch (err) {
        console.error('Failed to send for refill:', err);
        throw err;
      }
    }, 'Dispatching Refill Trip...', 'Deducting empty cylinders from stock');
  };

  const returnFromRefill = async (tripId, filledCount) => {
    return withLoading(async () => {
      const trip = refillTrips.find(t => t.id === tripId);
      if (!trip) return;

      try {
        await updateStock(trip.cylinderType, Number(filledCount), 0);
        const updatedTrip = await db.patchRefillTrip(tripId, {
          status: 'Returned',
          filledReturnedCount: Number(filledCount),
          dateReturned: new Date().toISOString(),
        });
        setRefillTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updatedTrip } : t));
        return updatedTrip;
      } catch (err) {
        console.error('Failed to return from refill:', err);
        throw err;
      }
    }, 'Receiving Refill Return...', 'Adding filled cylinders to stock');
  };

  const editRefillTrip = async (tripId, updates) => {
    return withLoading(async () => {
      const oldTrip = refillTrips.find(t => t.id === tripId);
      if (!oldTrip) return;

      try {
        // 1. Revert old trip impact on warehouse stock
        // When sent: emptyCount was reduced by oldTrip.emptySentCount -> so add it back!
        // When returned: filledCount was increased by oldTrip.filledReturnedCount -> so subtract it!
        const oldEmptyRevert = Number(oldTrip.emptySentCount) || 0;
        const oldFilledRevert = oldTrip.status === 'Returned' ? -(Number(oldTrip.filledReturnedCount) || 0) : 0;
        await updateStock(oldTrip.cylinderType, oldFilledRevert, oldEmptyRevert);

        // 2. Compute new trip values
        const newCylinderType = updates.cylinderType || oldTrip.cylinderType;
        const newEmptySent = updates.emptySentCount !== undefined ? Number(updates.emptySentCount) : Number(oldTrip.emptySentCount);
        const newStatus = updates.status || oldTrip.status;
        const newFilledReturned = updates.filledReturnedCount !== undefined ? Number(updates.filledReturnedCount) : (Number(oldTrip.filledReturnedCount) || 0);

        // 3. Apply new trip impact on warehouse stock
        const newEmptyDeduct = -newEmptySent;
        const newFilledAdd = newStatus === 'Returned' ? newFilledReturned : 0;
        await updateStock(newCylinderType, newFilledAdd, newEmptyDeduct);

        // 4. Update in database & state
        const updatedTrip = await db.patchRefillTrip(tripId, updates);
        setRefillTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updatedTrip } : t));
        return updatedTrip;
      } catch (err) {
        console.error('Failed to edit refill trip:', err);
        throw err;
      }
    }, 'Updating Refill Trip...', 'Adjusting cylinder stock & records');
  };

  const deleteRefillTrip = async (tripId) => {
    return withLoading(async () => {
      const trip = refillTrips.find(t => t.id === tripId);
      if (!trip) return;

      try {
        // Revert stock impact cleanly:
        // Empty cylinders sent were removed from stock -> restore them!
        // Filled cylinders received were added to stock -> deduct them!
        const emptyRevert = Number(trip.emptySentCount) || 0;
        const filledRevert = trip.status === 'Returned' ? -(Number(trip.filledReturnedCount) || 0) : 0;
        await updateStock(trip.cylinderType, filledRevert, emptyRevert);

        await db.removeRefillTrip(tripId);
        setRefillTrips(prev => prev.filter(t => t.id !== tripId));
      } catch (err) {
        console.error('Failed to delete refill trip:', err);
        throw err;
      }
    }, 'Deleting Refill Trip...', 'Restoring cylinder stock balances');
  };

  // ==================== PERSONAL NOTES ====================

  const addNote = async (noteData) => {
    return withLoading(async () => {
      try {
        const newNote = await db.insertNote(noteData);
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      } catch (err) {
        console.error('Failed to add note:', err);
        throw err;
      }
    }, 'Saving Note...', 'Storing note content');
  };

  const updateNote = async (id, updates) => {
    return withLoading(async () => {
      try {
        const updatedNote = await db.patchNote(id, updates);
        setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
        return updatedNote;
      } catch (err) {
        console.error('Failed to update note:', err);
        throw err;
      }
    }, 'Updating Note...', 'Saving changes');
  };

  const deleteNote = async (id) => {
    return withLoading(async () => {
      try {
        await db.removeNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
      } catch (err) {
        console.error('Failed to delete note:', err);
        throw err;
      }
    }, 'Deleting Note...', 'Removing personal note');
  };

  // ==================== RESET ALL DATA ====================

  const RESET_PIN = '2323';

  const resetAllDataWithPin = async (enteredPin) => {
    if (enteredPin !== RESET_PIN) {
      throw new Error('INVALID_PIN');
    }
    return withLoading(async () => {
      try {
        await db.resetAllData();
        // Clear all local state
        setCustomers([]);
        setInvoices([]);
        setExpenses([]);
        setRefillTrips([]);
        setNotes([]);
        setStock(prev => prev.map(s => ({ ...s, filledCount: 0, emptyCount: 0 })));
        return true;
      } catch (err) {
        console.error('Failed to reset data:', err);
        throw err;
      }
    }, 'Resetting All Data...', 'Clearing database records to initial state');
  };

  // ==================== MARKET PRICES & DISCOUNTS ====================

  const updateMarketPrices = async (newPrices, autoUpdateCustomers = true) => {
    return withLoading(async () => {
      try {
        const oldMarketPrices = { ...marketPrices };
        const saved = await db.saveMarketPrices(newPrices);
        setMarketPrices(saved.prices);
        setMarketPricesMeta(saved.meta);

        if (autoUpdateCustomers && customers.length > 0) {
          const updatedCusts = await db.updateAllCustomersWithNewMarketPrices(saved.prices, customers, oldMarketPrices);
          setCustomers(updatedCusts);
          return { updatedCustomersCount: updatedCusts.length, prices: saved.prices };
        }
        return { updatedCustomersCount: 0, prices: saved.prices };
      } catch (err) {
        console.error('Failed to update market prices:', err);
        throw err;
      }
    }, 'Updating Market Prices...', 'Calculating rates and customer discounts');
  };

  const updateCustomerDiscounts = async (customerId, discounts, customPrices) => {
    return withLoading(async () => {
      try {
        const updatedCust = await db.patchCustomer(customerId, {
          prices: {
            ...customPrices,
            discounts,
          },
          discounts,
        });
        setCustomers(prev => prev.map(c => c.id === customerId ? updatedCust : c));
        return updatedCust;
      } catch (err) {
        console.error('Failed to update customer discounts:', err);
        throw err;
      }
    }, 'Updating Pricing...', 'Saving custom customer rates');
  };

  // ==================== AGENCY SETTINGS ====================

  const updateAgencySettings = async (newSettings) => {
    return withLoading(async () => {
      try {
        const res = await db.saveAgencySettings(newSettings, currentUser?.name || 'Admin');
        setAgencySettings(res.settings);
        setAgencySettingsMeta({
          syncedWithSupabase: res.syncedWithSupabase,
          error: res.error,
          updatedAt: res.settings.updatedAt,
        });
        return res;
      } catch (err) {
        console.error('Failed to update agency settings:', err);
        throw err;
      }
    }, 'Saving Agency Settings...', 'Updating agency profile & configuration');
  };

  const resetAgencySettings = async () => {
    return withLoading(async () => {
      try {
        const res = await db.saveAgencySettings(DEFAULT_AGENCY_SETTINGS, currentUser?.name || 'Admin');
        setAgencySettings(res.settings);
        setAgencySettingsMeta({
          syncedWithSupabase: res.syncedWithSupabase,
          error: res.error,
          updatedAt: res.settings.updatedAt,
        });
        return res;
      } catch (err) {
        console.error('Failed to reset agency settings:', err);
        throw err;
      }
    }, 'Resetting Settings...', 'Restoring default configuration');
  };

  // ==================== CONTEXT VALUE ====================

  return (
    <AppContext.Provider value={{
      isLoggedIn, login, logout,
      currentUser, appUsers, createAppUser, updateAppUser, deleteAppUser,
      hasModuleAccess, canEditModule,
      loading, error, reloadData: loadAllData,
      globalLoading, globalLoadingMessage, globalLoadingSubtext,
      showLoading, hideLoading, forceHideLoading, withLoading,
      customers, addCustomer, updateCustomer, deleteCustomer,
      marketPrices, marketPricesMeta, updateMarketPrices, updateCustomerDiscounts,
      agencySettings, agencySettingsMeta, updateAgencySettings, resetAgencySettings,
      stock, updateStock, updateStockBatch, addStockManual, getStockByType,
      invoices, createInvoice, updateInvoice, editInvoiceFull, deleteInvoice,
      updateBottleBalance, setBottleBalanceDirect, updateEmptyBottleStock,
      expenses, addExpense, updateExpense, deleteExpense,
      refillTrips, sendForRefill, returnFromRefill, editRefillTrip, deleteRefillTrip,
      notes, addNote, updateNote, deleteNote,
      resetAllDataWithPin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
