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
  CashierShift, Promo, AuditLogEntry, AppSettings, LoyaltySettings 
} from '../types';
import type { StockLogEntry } from '../store/stockLogStore';

// NOTE: camelCase↔snake_case mapping is done explicitly per sync function
// for full control and visibility of field mappings.

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
  // BUG-C1 fix: items already contain post-deduction stock values (deducted in inventoryStore).
  // Previously this subtracted `amount` again, causing double deduction in cloud.
  for (const [id] of Object.entries(deductions)) {
    const item = items.find((i) => i.id === id);
    if (item) {
      await smartUpdate('inventory', { stock: item.stock }, 'id', id);
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
    created_at: customer.createdAt,
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
      demoMode: data.demo_mode !== false,
    };
  } catch (e) {
    console.warn('[CloudSync] Fetch settings failed:', e);
    return null;
  }
}

// ============================================================
// LOYALTY SETTINGS (BUG-M5 fix: sync across devices)
// Uses settings table row id=2 to store loyalty config as JSON
// ============================================================

export async function syncLoyaltySettings(ls: LoyaltySettings) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('settings', {
    id: 2,
    store_name: '__loyalty_settings__',
    manager_pin: '0000',
    categories: ls,
  });
}

export async function fetchLoyaltySettingsFromCloud(): Promise<LoyaltySettings | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('settings').select('categories').eq('id', 2).single();
    if (error || !data?.categories) return null;
    return data.categories as LoyaltySettings;
  } catch {
    return null;
  }
}

// ============================================================
// CUSTOM CATEGORIES (GAP-1 fix: sync across devices)
// Uses settings table row id=3 to store categories as JSON
// ============================================================

export async function syncCustomCategories(categories: string[]) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('settings', {
    id: 3,
    store_name: '__custom_categories__',
    manager_pin: '0000',
    categories: categories,
  });
}

export async function fetchCustomCategoriesFromCloud(): Promise<string[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('settings').select('categories').eq('id', 3).single();
    if (error || !data?.categories) return null;
    return data.categories as string[];
  } catch {
    return null;
  }
}

// ============================================================
// FETCH ALL SHARED DATA (for multi-device sync on load)
// ============================================================

export async function fetchCustomersFromCloud(): Promise<Customer[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone || undefined,
      email: row.email || undefined,
      notes: row.notes || undefined,
      totalSpent: row.total_spent || 0,
      visitCount: row.visit_count || 0,
      lastVisit: row.last_visit || undefined,
      createdAt: row.created_at,
    })) || null;
  } catch {
    return null;
  }
}

export async function fetchMenusFromCloud(): Promise<Menu[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('menus').select('*');
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      image: row.image || undefined,
      isBestSeller: row.is_best_seller || false,
      isAvailable: row.is_available !== false,
      ingredients: row.ingredients || {},
      availableAddons: row.available_addons || [],
      description: row.description || undefined,
    })) || null;
  } catch {
    return null;
  }
}

export async function fetchInventoryFromCloud(): Promise<InventoryItem[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('inventory').select('*');
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      name: row.name,
      stock: row.stock,
      unit: row.unit,
      costPerUnit: row.cost_per_unit,
      minStock: row.min_stock,
    })) || null;
  } catch {
    return null;
  }
}

// ============================================================
// USERS (BUG-10 fix: multi-device user sync)
// ============================================================

export async function syncUser(user: User) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('users', {
    id: user.id,
    name: user.name,
    username: user.username,
    password: user.password,
    role: user.role,
    created_at: user.createdAt,
  });
}

export async function deleteUserCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('users', 'id', id);
}

export async function fetchUsersFromCloud(): Promise<User[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
    })) || null;
  } catch {
    return null;
  }
}

// ============================================================
// PROMOS (BUG-10 fix: multi-device promo sync)
// ============================================================

export async function syncPromo(promo: Promo) {
  if (!isSupabaseConfigured) return;
  await smartUpsert('promos', {
    id: promo.id,
    name: promo.name,
    code: promo.code || null,
    type: promo.type,
    value: promo.value,
    scope: promo.scope,
    scope_target: promo.scopeTarget || null,
    min_purchase: promo.minPurchase || null,
    max_discount: promo.maxDiscount || null,
    start_date: promo.startDate,
    end_date: promo.endDate,
    is_active: promo.isActive,
    usage_limit: promo.usageLimit || null,
    usage_count: promo.usageCount,
    loyalty_min_visits: promo.loyaltyMinVisits || null,
    // BUG-NEW-07 fix: Include createdAt to prevent null column in cloud
    created_at: promo.createdAt || new Date().toISOString(),
  });
}

export async function deletePromoCloud(id: string) {
  if (!isSupabaseConfigured) return;
  await smartDelete('promos', 'id', id);
}

export async function fetchPromosFromCloud(): Promise<Promo[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('promos').select('*');
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code || undefined,
      type: row.type,
      value: row.value,
      scope: row.scope || 'all',
      scopeTarget: row.scope_target || undefined,
      minPurchase: row.min_purchase || undefined,
      maxDiscount: row.max_discount || undefined,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active !== false,
      usageLimit: row.usage_limit || undefined,
      usageCount: row.usage_count || 0,
      loyaltyMinVisits: row.loyalty_min_visits || undefined,
      createdAt: row.created_at,
    })) || null;
  } catch {
    return null;
  }
}

// ============================================================
// SHIFTS (BUG-C3 fix: multi-device shift sync)
// ============================================================

export async function fetchShiftsFromCloud(): Promise<CashierShift[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('shifts').select('*').order('opened_at', { ascending: false }).limit(200);
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      openedAt: row.opened_at,
      closedAt: row.closed_at || undefined,
      openingCash: row.opening_cash,
      closingCash: row.closing_cash ?? undefined,
      expectedCash: row.expected_cash ?? undefined,
      cashDifference: row.cash_difference ?? undefined,
      totalSales: row.total_sales || 0,
      totalTransactions: row.total_transactions || 0,
      status: row.status,
    })) || null;
  } catch {
    return null;
  }
}

// ============================================================
// STOCK LOGS (BUG-C4 fix: cloud sync for stock_logs)
// ============================================================

export async function syncStockLog(entry: StockLogEntry) {
  if (!isSupabaseConfigured) return;
  await smartInsert('stock_logs', {
    id: entry.id,
    inventory_id: entry.inventoryId,
    inventory_name: entry.inventoryName,
    type: entry.type,
    amount: entry.amount,
    stock_before: entry.stockBefore,
    stock_after: entry.stockAfter,
    unit: entry.unit,
    reason: entry.reason || null,
    date: entry.date,
  });
}

export async function fetchStockLogsFromCloud(): Promise<StockLogEntry[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('stock_logs').select('*').order('date', { ascending: false }).limit(500);
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      inventoryId: row.inventory_id,
      inventoryName: row.inventory_name,
      type: row.type,
      amount: row.amount,
      stockBefore: row.stock_before,
      stockAfter: row.stock_after,
      unit: row.unit,
      reason: row.reason || undefined,
      date: row.date,
    })) || null;
  } catch {
    return null;
  }
}

// ============================================================
// AUDIT LOGS (BUG-C4 fix: fetch audit logs from cloud)
// ============================================================

export async function fetchAuditLogsFromCloud(): Promise<AuditLogEntry[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    if (error) return null;
    return data?.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userRole: row.user_role,
      action: row.action,
      detail: row.detail,
      timestamp: row.timestamp,
      metadata: row.metadata || undefined,
    })) || null;
  } catch {
    return null;
  }
}

