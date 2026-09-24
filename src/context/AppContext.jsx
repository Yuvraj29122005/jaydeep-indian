import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================== AUTH & PERMISSIONS ====================

  const login = async (identifier, password) => {
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
    try {
      const created = await db.insertAppUser(userData);
      setAppUsers(prev => [created, ...prev.filter(u => u.id !== created.id)]);
      return created;
    } catch (err) {
      console.error('Failed to create user:', err);
      throw err;
    }
  };

  const updateAppUser = async (id, updates) => {
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
  };

  const deleteAppUser = async (id) => {
    try {
      await db.removeAppUser(id);
      setAppUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  };

  // ==================== CUSTOMERS ====================

  const addCustomer = async (customer) => {
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
  };

  const updateCustomer = async (id, updated) => {
    try {
      const updatedCust = await db.patchCustomer(id, updated);
      setCustomers(prev => prev.map(c => c.id === id ? updatedCust : c));
    } catch (err) {
      console.error('Failed to update customer:', err);
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await db.removeCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete customer:', err);
      throw err;
    }
  };

  const defaultBottleBalance = () => ({
    '5kg': { filledGiven: 0, emptyCollected: 0 },
    '19kg': { filledGiven: 0, emptyCollected: 0 },
    '47.5kg': { filledGiven: 0, emptyCollected: 0 },
  });

  const applyInvoiceBottleChangesToCustomer = async (customerId, deltas) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const bal = JSON.parse(JSON.stringify(customer.bottleBalance || defaultBottleBalance()));
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
  };

  // ==================== STOCK ====================

  const updateStock = async (cylinderType, filledDelta, emptyDelta) => {
    const s = stock.find(st => st.cylinderType === cylinderType);
    if (!s) return;

    const newFilled = Math.max(0, s.filledCount + filledDelta);
    const newEmpty = Math.max(0, s.emptyCount + emptyDelta);

    try {
      await db.patchStock(cylinderType, { filledCount: newFilled, emptyCount: newEmpty });
      setStock(prev => prev.map(st =>
        st.cylinderType === cylinderType
          ? { ...st, filledCount: newFilled, emptyCount: newEmpty }
          : st
      ));
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const addStockManual = async (cylinderType, filledAdd, emptyAdd) => {
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
  };

  const getStockByType = (type) => stock.find(s => s.cylinderType === type) || { filledCount: 0, emptyCount: 0 };

  // ==================== INVOICES ====================

  const createInvoice = async (invoiceData) => {
    try {
      const isEB = invoiceData.invoiceType === 'Empty Bottle';
      const defaultPrefix = isEB ? 'EB' : 'JIG';
      const invoiceNumber = invoiceData.invoiceNumber || `${defaultPrefix}-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      
      const newInvoice = await db.insertInvoice({
        ...invoiceData,
        invoiceNumber,
      });

      setInvoices(prev => [...prev, newInvoice]);

      // Calculate deltas for customer and update agency warehouse stock
      if (invoiceData.items && invoiceData.customerId) {
        const customerDeltas = {};

        for (const item of invoiceData.items) {
          const type = item.cylinderType;
          const isItemEmpty = isEB || item.itemType === 'empty' || item.isBottleOnly;
          const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
          const emptyGain = isItemEmpty 
            ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
            : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

          // Update warehouse agency stock
          await updateStock(type, -filledQty, emptyGain);

          if (!customerDeltas[type]) {
            customerDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
          }
          customerDeltas[type].filledDelta += filledQty;
          customerDeltas[type].withCustomerDelta += filledQty;
          customerDeltas[type].emptyCollectedDelta += emptyGain;
        }

        // Atomically sync customer status (both empty and filled)
        await applyInvoiceBottleChangesToCustomer(invoiceData.customerId, customerDeltas);
      }

      return newInvoice;
    } catch (err) {
      console.error('Failed to create invoice:', err);
      throw err;
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      const updatedInv = await db.patchInvoice(id, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInv : inv));
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  };

  const editInvoiceFull = async (id, updates) => {
    const oldInv = invoices.find(i => i.id === id);
    if (!oldInv) return;

    try {
      const oldIsEB = oldInv.invoiceType === 'Empty Bottle';
      const newIsEB = updates.invoiceType === 'Empty Bottle' || (updates.invoiceType === undefined && oldIsEB);

      // Revert old items from warehouse stock and old customer
      if (oldInv.items && oldInv.customerId) {
        const revertDeltas = {};
        for (const item of oldInv.items) {
          const type = item.cylinderType;
          const isItemEmpty = oldIsEB || item.itemType === 'empty' || item.isBottleOnly;
          const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
          const emptyGain = isItemEmpty 
            ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
            : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

          await updateStock(type, filledQty, -emptyGain);

          if (!revertDeltas[type]) {
            revertDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
          }
          revertDeltas[type].filledDelta -= filledQty;
          revertDeltas[type].withCustomerDelta -= filledQty;
          revertDeltas[type].emptyCollectedDelta -= emptyGain;
        }
        await applyInvoiceBottleChangesToCustomer(oldInv.customerId, revertDeltas);
      }

      // Apply new items to warehouse stock and new/updated customer
      const targetCustomerId = updates.customerId || oldInv.customerId;
      const targetItems = updates.items || oldInv.items;

      if (targetItems && targetCustomerId) {
        const applyDeltas = {};
        for (const item of targetItems) {
          const type = item.cylinderType;
          const isItemEmpty = newIsEB || item.itemType === 'empty' || item.isBottleOnly;
          const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
          const emptyGain = isItemEmpty 
            ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
            : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

          await updateStock(type, -filledQty, emptyGain);

          if (!applyDeltas[type]) {
            applyDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
          }
          applyDeltas[type].filledDelta += filledQty;
          applyDeltas[type].withCustomerDelta += filledQty;
          applyDeltas[type].emptyCollectedDelta += emptyGain;
        }
        await applyInvoiceBottleChangesToCustomer(targetCustomerId, applyDeltas);
      }

      const updatedInv = await db.patchInvoice(id, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInv : inv));
      return updatedInv;
    } catch (err) {
      console.error('Failed to edit invoice:', err);
      throw err;
    }
  };

  const deleteInvoice = async (id) => {
    const oldInv = invoices.find(i => i.id === id);
    if (!oldInv) return;

    try {
      const oldIsEB = oldInv.invoiceType === 'Empty Bottle';
      if (oldInv.items && oldInv.customerId) {
        const revertDeltas = {};
        for (const item of oldInv.items) {
          const type = item.cylinderType;
          const isItemEmpty = oldIsEB || item.itemType === 'empty' || item.isBottleOnly;
          const filledQty = isItemEmpty ? 0 : (Number(item.qty) || 0);
          const emptyGain = isItemEmpty 
            ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0)
            : (item.emptyCollected ? (Number(item.emptyCount !== undefined ? item.emptyCount : item.qty) || 0) : 0);

          await updateStock(type, filledQty, -emptyGain);

          if (!revertDeltas[type]) {
            revertDeltas[type] = { filledDelta: 0, emptyCollectedDelta: 0, withCustomerDelta: 0 };
          }
          revertDeltas[type].filledDelta -= filledQty;
          revertDeltas[type].withCustomerDelta -= filledQty;
          revertDeltas[type].emptyCollectedDelta -= emptyGain;
        }
        await applyInvoiceBottleChangesToCustomer(oldInv.customerId, revertDeltas);
      }

      await db.removeInvoice(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      throw err;
    }
  };


  // ==================== EXPENSES ====================

  const addExpense = async (expenseData) => {
    try {
      const newExpense = await db.insertExpense(expenseData);
      setExpenses(prev => [...prev, newExpense]);
      return newExpense;
    } catch (err) {
      console.error('Failed to add expense:', err);
      throw err;
    }
  };

  const updateExpense = async (id, updated) => {
    try {
      const updatedExp = await db.patchExpense(id, updated);
      setExpenses(prev => prev.map(e => e.id === id ? updatedExp : e));
    } catch (err) {
      console.error('Failed to update expense:', err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await db.removeExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  // ==================== REFILL TRIPS ====================

  const sendForRefill = async (cylinderType, emptyCount) => {
    try {
      await updateStock(cylinderType, 0, -emptyCount);
      const newTrip = await db.insertRefillTrip({
        cylinderType,
        emptySentCount: emptyCount,
      });
      setRefillTrips(prev => [newTrip, ...prev]);
    } catch (err) {
      console.error('Failed to send for refill:', err);
    }
  };

  const returnFromRefill = async (tripId, filledCount) => {
    const trip = refillTrips.find(t => t.id === tripId);
    if (!trip) return;

    try {
      await updateStock(trip.cylinderType, filledCount, 0);
      const updatedTrip = await db.patchRefillTrip(tripId, {
        status: 'Returned',
        filledReturnedCount: filledCount,
        dateReturned: new Date().toISOString(),
      });
      setRefillTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
    } catch (err) {
      console.error('Failed to return from refill:', err);
    }
  };

  // ==================== PERSONAL NOTES ====================

  const addNote = async (noteData) => {
    try {
      const newNote = await db.insertNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Failed to add note:', err);
      throw err;
    }
  };

  const updateNote = async (id, updates) => {
    try {
      const updatedNote = await db.patchNote(id, updates);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw err;
    }
  };

  const deleteNote = async (id) => {
    try {
      await db.removeNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw err;
    }
  };

  // ==================== RESET ALL DATA ====================

  const RESET_PIN = '2323';

  const resetAllDataWithPin = async (enteredPin) => {
    if (enteredPin !== RESET_PIN) {
      throw new Error('INVALID_PIN');
    }
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
  };

  // ==================== MARKET PRICES & DISCOUNTS ====================

  const updateMarketPrices = async (newPrices, autoUpdateCustomers = true) => {
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
  };

  const updateCustomerDiscounts = async (customerId, discounts, customPrices) => {
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
  };

  // ==================== AGENCY SETTINGS ====================

  const updateAgencySettings = async (newSettings) => {
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
  };

  const resetAgencySettings = async () => {
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
  };

  // ==================== CONTEXT VALUE ====================

  return (
    <AppContext.Provider value={{
      isLoggedIn, login, logout,
      currentUser, appUsers, createAppUser, updateAppUser, deleteAppUser,
      hasModuleAccess, canEditModule,
      loading, error, reloadData: loadAllData,
      customers, addCustomer, updateCustomer, deleteCustomer,
      marketPrices, marketPricesMeta, updateMarketPrices, updateCustomerDiscounts,
      agencySettings, agencySettingsMeta, updateAgencySettings, resetAgencySettings,
      stock, updateStock, addStockManual, getStockByType,
      invoices, createInvoice, updateInvoice, editInvoiceFull, deleteInvoice,
      updateBottleBalance, setBottleBalanceDirect, updateEmptyBottleStock,
      expenses, addExpense, updateExpense, deleteExpense,
      refillTrips, sendForRefill, returnFromRefill,
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
