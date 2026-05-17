/**
 * Data Manager — Reset demo data & clear production data
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Reset ke Default (Demo Mode)
 * Menghapus semua data localStorage dan reload.
 * Data akan kembali ke seed default.
 */
export function resetToDefault() {
  // Clear all app localStorage keys
  const keysToRemove = [
    'rempah-auth',
    'rempah-menus',
    'rempah-inventory',
    'rempah-transactions',
    'rempah-cart',
    'rempah-customers',
    'rempah-shifts',
    'rempah-settings',
    'rempah-stock-logs',
    'rempah-promos',
    'rempah-audit-logs',
  ];
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Reload app — will reinitialize with seed data
  window.location.reload();
}

/**
 * Clear Semua Transaksi & Data Operasional
 * Untuk fresh start (klien baru). Mempertahankan:
 * - Users (akun login)
 * - Settings (nama toko, logo, printer)
 * - Menus (katalog produk)
 * - Inventory (bahan baku)
 * 
 * Menghapus:
 * - Transactions
 * - Shifts
 * - Customers
 * - Audit logs
 * - Stock logs
 * - Cart
 * - Promos
 */
export function clearOperationalData() {
  const keysToClear = [
    'rempah-transactions',
    'rempah-cart',
    'rempah-shifts',
    'rempah-customers',
    'rempah-stock-logs',
    'rempah-audit-logs',
    'rempah-promos',
  ];
  keysToClear.forEach((key) => localStorage.removeItem(key));

  // Also clear from Supabase if configured
  if (isSupabaseConfigured) {
    clearCloudOperationalData();
  }

  window.location.reload();
}

/**
 * Clear ALL data (full factory reset)
 * Menghapus semua data termasuk menu, inventory, settings.
 * Sama seperti resetToDefault tapi juga clear cloud.
 */
export function factoryReset() {
  // Clear all localStorage
  const keysToRemove = [
    'rempah-auth',
    'rempah-menus',
    'rempah-inventory',
    'rempah-transactions',
    'rempah-cart',
    'rempah-customers',
    'rempah-shifts',
    'rempah-settings',
    'rempah-stock-logs',
    'rempah-promos',
    'rempah-audit-logs',
  ];
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Clear cloud data
  if (isSupabaseConfigured) {
    clearAllCloudData();
  }

  window.location.reload();
}

// Cloud cleanup helpers
async function clearCloudOperationalData() {
  try {
    await supabase.from('transactions').delete().neq('id', '');
    await supabase.from('shifts').delete().neq('id', '');
    await supabase.from('customers').delete().neq('id', '');
    await supabase.from('audit_logs').delete().neq('id', '');
    await supabase.from('stock_logs').delete().neq('id', '');
    await supabase.from('promos').delete().neq('id', '');
  } catch (e) {
    console.warn('Cloud clear failed:', e);
  }
}

async function clearAllCloudData() {
  try {
    await supabase.from('transactions').delete().neq('id', '');
    await supabase.from('shifts').delete().neq('id', '');
    await supabase.from('customers').delete().neq('id', '');
    await supabase.from('audit_logs').delete().neq('id', '');
    await supabase.from('stock_logs').delete().neq('id', '');
    await supabase.from('promos').delete().neq('id', '');
    await supabase.from('menus').delete().neq('id', '');
    await supabase.from('inventory').delete().neq('id', '');
  } catch (e) {
    console.warn('Cloud factory reset failed:', e);
  }
}
