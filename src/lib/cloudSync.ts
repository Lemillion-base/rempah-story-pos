/**
 * Cloud Sync Service
 * 
 * Provides functions to sync local Zustand state with Supabase.
 * Strategy: Local-first with background sync.
 * - Writes go to both localStorage (instant) and Supabase (async)
 * - Reads prefer Supabase if available, fallback to localStorage
 * - Real-time subscriptions for KDS (transactions table)
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { smartUpsert, smartUpdate, smartDelete, smartInsert } from './offlineQueue';
import type { 
  User, InventoryItem, Menu, Transaction, Customer, 
  CashierShift, Promo, AuditLogEntry, AppSettings 
} from '../types';
import type { StockLogEntry } from '../store/stockLogStore';

// ============================================================
// HELPER: Convert between camelCase (app) and snake_case (DB)
// ============================================================

function toSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

function toCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// ============================================================
// TRANSACTIONS (most critical for KDS real-time)
// ============================================================

export async function syncTransaction(tx: Transaction) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('transactions', {
    id: tx.id,
    queue_number: tx.queueNumber,
    date: tx.date,
    items: tx.items,
    subtotal: tx.subtotal,
    discount: tx.discount,
    total_amount: tx.totalAmount,
    payment_method: tx.paymentMethod,
    cash_received: tx.cashReceived,
    change: tx.change,
    kitchen_status: tx.kitchenStatus,
    tx_status: tx.txStatus,
    cashier_id: tx.cashierId,
    cashier_name: tx.cashierName,
    customer_id: tx.customerId,
    customer_name: tx.customerName,
    hpp: tx.hpp,
  });
}

export async function syncTransactionStatus(id: string, kitchenStatus: string) {
  if (!isSupabaseConfigured) return;
  await smartUpdate('transactions', { kitchen_status: kitchenStatus }, 'id', id);
}

export async function syncTransactionTxStatus(id: string, txStatus: string) {
  if (!isSupabaseConfigured) return;
  await smartUpdate('transactions', { tx_status: txStatus }, 'id', id);
}

export async function deleteTransactionCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('transactions', 'id', id);
}

export async function fetchTransactionsFromCloud(): Promise<Transaction[] | null> {
  if (!isSupabaseConfigured) { console.log('[CloudSync] Not configured'); return null; }
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(500);
    if (error) { console.error('[CloudSync] Fetch error:', error.message); throw error; }
    console.log('[CloudSync] Fetched', data?.length || 0, 'transactions from cloud');
    return data?.map((row) => ({
      id: row.id,
      queueNumber: row.queue_number,
      date: row.date,
      items: row.items,
      subtotal: row.subtotal,
      discount: row.discount,
      totalAmount: row.total_amount,
      paymentMethod: row.payment_method,
      cashReceived: row.cash_received,
      change: row.change,
      kitchenStatus: row.kitchen_status,
      txStatus: row.tx_status,
      cashierId: row.cashier_id,
      cashierName: row.cashier_name,
      customerId: row.customer_id,
      customerName: row.customer_name,
      hpp: row.hpp,
    })) || null;
  } catch (e) {
    console.error('[CloudSync] Fetch EXCEPTION:', e);
    return null;
  }
}

// ============================================================
// REAL-TIME SUBSCRIPTION (for KDS)
// ============================================================

export function subscribeToTransactions(callback: (payload: any) => void) {
  if (!isSupabaseConfigured) return null;
  
  const channel = supabase
    .channel('transactions-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      callback
    )
    .subscribe();

  return channel;
}

export function unsubscribeChannel(channel: any) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// ============================================================
// INVENTORY
// ============================================================

export async function syncInventoryItem(item: InventoryItem) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('inventory', {
    id: item.id,
    name: item.name,
    stock: item.stock,
    unit: item.unit,
    cost_per_unit: item.costPerUnit,
    min_stock: item.minStock,
  });
}

export async function syncInventoryDeduction(deductions: Record<string, number>, items: InventoryItem[]) {
  if (!isSupabaseConfigured) return;
  for (const [id, amount] of Object.entries(deductions)) {
    const item = items.find((i) => i.id === id);
    if (item) {
      await smartUpdate('inventory', { stock: Math.max(0, item.stock - amount) }, 'id', id);
    }
  }
}

export async function deleteInventoryCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('inventory', 'id', id);
}

// ============================================================
// MENUS
// ============================================================

export async function syncMenu(menu: Menu) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('menus', {
    id: menu.id,
    name: menu.name,
    category: menu.category,
    price: menu.price,
    image: menu.image,
    is_best_seller: menu.isBestSeller,
    is_available: menu.isAvailable,
    ingredients: menu.ingredients,
    available_addons: menu.availableAddons,
    description: menu.description,
  });
}

export async function deleteMenuCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('menus', 'id', id);
}

// ============================================================
// CUSTOMERS
// ============================================================

export async function syncCustomer(customer: Customer) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('customers', {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    notes: customer.notes,
    total_spent: customer.totalSpent,
    visit_count: customer.visitCount,
    last_visit: customer.lastVisit,
  });
}

export async function deleteCustomerCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('customers', 'id', id);
}

// ============================================================
// SHIFTS
// ============================================================

export async function syncShift(shift: CashierShift) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('shifts', {
    id: shift.id,
    user_id: shift.userId,
    user_name: shift.userName,
    opened_at: shift.openedAt,
    closed_at: shift.closedAt,
    opening_cash: shift.openingCash,
    closing_cash: shift.closingCash,
    expected_cash: shift.expectedCash,
    cash_difference: shift.cashDifference,
    total_sales: shift.totalSales,
    total_transactions: shift.totalTransactions,
    status: shift.status,
  });
}

// ============================================================
// AUDIT LOG
// ============================================================

export async function syncAuditLog(entry: AuditLogEntry) {
  if (!isSupabaseConfigured) return;
  await smartInsert('audit_logs', {
    id: entry.id,
    user_id: entry.userId,
    user_name: entry.userName,
    user_role: entry.userRole,
    action: entry.action,
    detail: entry.detail,
    metadata: entry.metadata,
    timestamp: entry.timestamp,
  });
}

// ============================================================
// CONNECTION CHECK
// ============================================================

export async function checkConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// SETTINGS (sync logo, store name, etc across devices)
// ============================================================

export async function syncSettings(settings: AppSettings) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('settings', {
    id: 1,
    manager_pin: settings.managerPin,
    store_name: settings.storeName,
    store_logo: settings.storeLogo || null,
    address: settings.address || null,
    tax_percent: settings.taxPercent || 0,
    categories: settings.categories,
    printer_enabled: settings.printerEnabled,
    printer_type: settings.printerType,
    printer_width: settings.printerWidth,
    auto_print_on_checkout: settings.autoPrintOnCheckout,
    super_admin_pin: settings.superAdminPin,
    demo_mode: settings.demoMode,
  });
}

export async function fetchSettingsFromCloud(): Promise<AppSettings | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (error || !data) return null;
    return {
      managerPin: data.manager_pin,
      storeName: data.store_name,
      storeLogo: data.store_logo || undefined,
      address: data.address || undefined,
      taxPercent: data.tax_percent || 0,
      categories: data.categories || [],
      printerEnabled: data.printer_enabled || false,
      printerType: data.printer_type || 'browser',
      printerWidth: data.printer_width || '58mm',
      autoPrintOnCheckout: data.auto_print_on_checkout || false,
      superAdminPin: data.super_admin_pin || '000000',
      demoMode: data.demo_mode !== false, // default true
    };
  } catch (e) {
    console.warn('[CloudSync] Fetch settings failed:', e);
    return null;
  }
}
