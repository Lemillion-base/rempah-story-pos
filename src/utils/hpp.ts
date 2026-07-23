import type { InventoryItem, Menu, CartItem } from '../types';

/**
 * Menghitung HPP (Harga Pokok Penjualan) sebuah menu
 * berdasarkan komposisi bahan baku dan costPerUnit inventory.
 */
export const calculateMenuHPP = (
  menu: Menu,
  inventory: InventoryItem[]
): number => {
  if (!menu.ingredients || Object.keys(menu.ingredients).length === 0) {
    return menu.manualHpp || 0;
  }
  let total = 0;
  for (const [invId, amount] of Object.entries(menu.ingredients)) {
    const inv = inventory.find((i) => i.id === invId);
    if (inv) total += inv.costPerUnit * amount;
  }
  return total;
};

/**
 * LOGIC-1 fix: Menghitung total HPP untuk seluruh cart item pada transaksi,
 * termasuk HPP dari add-ons (jika diisi).
 */
export const calculateTransactionHPP = (
  items: CartItem[],
  menus: Menu[],
  inventory: InventoryItem[]
): number => {
  let total = 0;
  for (const item of items) {
    const menu = menus.find((m) => m.id === item.menuId);
    if (menu) {
      // HPP menu utama × quantity
      total += calculateMenuHPP(menu, inventory) * item.quantity;
    }
    // HPP add-ons (jika ada field hpp di addon)
    for (const addon of item.addons) {
      if (addon.hpp && addon.hpp > 0) {
        total += addon.hpp * item.quantity;
      }
    }
  }
  return total;
};

/**
 * BUG-04 fix: Menghitung total kebutuhan bahan baku (deduksi stok)
 * dari seluruh item transaksi/cart, memperhitungkan bahan baku produk utama
 * DAN bahan baku dari addons yang dipilih.
 */
export const calculateItemDeductions = (
  items: CartItem[],
  menus: Menu[]
): Record<string, number> => {
  const deductions: Record<string, number> = {};

  for (const item of items) {
    const menu = menus.find((m) => m.id === item.menuId);
    if (menu && menu.ingredients) {
      for (const [invId, amount] of Object.entries(menu.ingredients)) {
        deductions[invId] = (deductions[invId] || 0) + amount * item.quantity;
      }
    }
    // Check ingredients on selected addons
    for (const addon of item.addons) {
      if (addon.ingredients) {
        for (const [invId, amount] of Object.entries(addon.ingredients)) {
          deductions[invId] = (deductions[invId] || 0) + amount * item.quantity;
        }
      } else if (menu) {
        const matchedAddon = menu.availableAddons?.find((a) => a.name === addon.name);
        if (matchedAddon?.ingredients) {
          for (const [invId, amount] of Object.entries(matchedAddon.ingredients)) {
            deductions[invId] = (deductions[invId] || 0) + amount * item.quantity;
          }
        }
      }
    }
  }

  return deductions;
};
