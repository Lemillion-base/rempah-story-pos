/**
 * Data Manager — Reset demo data & clear production data
 * 
 * Three levels of reset:
 * 1. resetToDefault: Reset to seed defaults (local + cloud), preserves nothing
 * 2. clearOperationalData: Clear transactions/logs, preserves users/menus/inventory/settings
 * 3. factoryReset: Full wipe + re-seed users/settings/menus/inventory to cloud
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncUser, syncSettings, syncMenu, syncInventoryItem } from '../lib/cloudSync';
import { seedUsers, seedMenus, seedInventory, seedSettings } from './seed';
import bcrypt from 'bcryptjs';

/**
 * Reset ke Default (Demo Mode)
 * Menghapus SEMUA data (lokal + cloud) lalu re-seed data default.
 * Setelah reload, data kembali ke seed default dan di-sync ke cloud.
 */
export async function resetToDefault() {
  // Clear cloud first, then re-seed
  if (isSupabaseConfigured) {
    await clearAllCloudData();
    await reseedCloudData();
  }

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
 * Factory Reset — Full wipe + re-seed
 * Menghapus SEMUA data (lokal + cloud) termasuk menu, inventory, settings.
 * TETAPI: Re-seed akun default (manager, kasir, acaraki) + settings ke cloud
 * agar admin masih bisa login setelah reset.
 */
export async function factoryReset() {
  // Clear cloud, then re-seed essential data
  if (isSupabaseConfigured) {
    await clearAllCloudData();
    await reseedCloudData();
  }

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

  window.location.reload();
}

// ============================================================
// Cloud helpers
// ============================================================

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
    await supabase.from('users').delete().neq('id', '');
    await supabase.from('settings').delete().neq('id', 0);
  } catch (e) {
    console.warn('Cloud factory reset failed:', e);
  }
}

/**
 * Re-seed essential data to cloud after a full wipe.
 * This ensures:
 * - Admin accounts exist so users can still login
 * - Default settings exist (store name, PIN, etc.)
 * - Seed menus & inventory are available
 * 
 * On next boot, fullSync=true will see this data in cloud and keep it.
 */
async function reseedCloudData() {
  try {
    // 1. Re-seed users (most critical — admin must be able to login)
    // BUG-NEW-03 fix: Hash passwords before sending to cloud
    for (const user of seedUsers) {
      const hashedUser = {
        ...user,
        password: bcrypt.hashSync(user.password, 8),
      };
      await syncUser(hashedUser);
    }

    // 2. Re-seed settings
    await syncSettings(seedSettings);

    // 3. Re-seed menus
    for (const menu of seedMenus) {
      await syncMenu(menu);
    }

    // 4. Re-seed inventory
    for (const item of seedInventory) {
      await syncInventoryItem(item);
    }

    console.log('[DataManager] Cloud re-seeded with default data');
  } catch (e) {
    console.warn('[DataManager] Cloud re-seed failed:', e);
  }
}
