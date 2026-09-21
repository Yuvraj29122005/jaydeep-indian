import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../lib/database';
import { defaultBottleBalance } from '../lib/constants';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth state — hardcoded credentials
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('jig_logged_in') === 'true';
  });

  // Data states
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refillTrips, setRefillTrips] = useState([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persist login state
  useEffect(() => {
    localStorage.setItem('jig_logged_in', isLoggedIn);
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
      ] = await Promise.all([
        db.fetchCustomers(),
        db.fetchStock(),
        db.fetchInvoices(),
        db.fetchExpenses(),
        db.fetchRefillTrips(),
      ]);
      setCustomers(customersData);
      setStock(stockData);
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setRefillTrips(refillTripsData);
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

  // ==================== AUTH ====================

  const login = (email, password) => {
    if (email === 'jaydeepindian01@gmail.com' && password === 'Jaydeep@1234') {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
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

  const updateBottleBalance = async (customerId, cylinderType, filledGivenDelta, emptyCollectedDelta) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const bal = customer.bottleBalance || defaultBottleBalance();
    const typeBal = bal[cylinderType] || { filledGiven: 0, emptyCollected: 0 };
    const newBalance = {
      ...bal,
      [cylinderType]: {
        filledGiven: Math.max(0, typeBal.filledGiven + filledGivenDelta),
        emptyCollected: Math.max(0, typeBal.emptyCollected + emptyCollectedDelta),
      },
    };

    try {
      await db.patchCustomer(customerId, { bottleBalance: newBalance });
      setCustomers(prev => prev.map(c =>
        c.id === customerId ? { ...c, bottleBalance: newBalance } : c
      ));
    } catch (err) {
      console.error('Failed to update bottle balance:', err);
    }
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

  // ==================== EMPTY BOTTLE STOCK (Separate from invoice tracking) ====================

  const updateEmptyBottleStock = async (customerId, newStock) => {
    try {
      const updatedCustomer = await db.patchCustomer(customerId, { emptyBottleStock: newStock });
      setCustomers(prev => prev.map(c =>
        c.id === customerId ? updatedCustomer : c
      ));
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
      const invoiceNumber = invoiceData.invoiceNumber || `JIG-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      const newInvoice = await db.insertInvoice({
        ...invoiceData,
        invoiceNumber,
      });

      setInvoices(prev => [...prev, newInvoice]);

      // Update stock & bottle balance for each item
      if (invoiceData.items) {
        for (const item of invoiceData.items) {
          const emptyGain = item.emptyCollected ? (item.emptyCount !== undefined ? item.emptyCount : item.qty) : 0;
          await updateStock(item.cylinderType, -item.qty, emptyGain);
          await updateBottleBalance(invoiceData.customerId, item.cylinderType, item.qty, emptyGain);
        }
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
      if (updates.items) {
        // Revert old items stock/balance
        for (const item of oldInv.items) {
          const emptyGain = item.emptyCollected ? (item.emptyCount !== undefined ? item.emptyCount : item.qty) : 0;
          await updateStock(item.cylinderType, item.qty, -emptyGain);
          await updateBottleBalance(oldInv.customerId, item.cylinderType, -item.qty, -emptyGain);
        }
        // Apply new items stock/balance
        for (const item of updates.items) {
          const emptyGain = item.emptyCollected ? (item.emptyCount !== undefined ? item.emptyCount : item.qty) : 0;
          await updateStock(item.cylinderType, -item.qty, emptyGain);
          await updateBottleBalance(updates.customerId || oldInv.customerId, item.cylinderType, item.qty, emptyGain);
        }
      }

      const updatedInv = await db.patchInvoice(id, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updatedInv : inv));
    } catch (err) {
      console.error('Failed to edit invoice:', err);
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

  // ==================== CONTEXT VALUE ====================

  return (
    <AppContext.Provider value={{
      isLoggedIn, login, logout,
      loading, error, reloadData: loadAllData,
      customers, addCustomer, updateCustomer, deleteCustomer,
      stock, updateStock, addStockManual, getStockByType,
      invoices, createInvoice, updateInvoice, editInvoiceFull,
      updateBottleBalance, setBottleBalanceDirect, updateEmptyBottleStock,
      expenses, addExpense, updateExpense, deleteExpense,
      refillTrips, sendForRefill, returnFromRefill,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
