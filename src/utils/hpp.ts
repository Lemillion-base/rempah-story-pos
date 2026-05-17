import type { InventoryItem, Menu, CartItem } from '../types';

/**
 * Menghitung HPP (Harga Pokok Penjualan) sebuah menu
 * berdasarkan komposisi bahan baku dan costPerUnit inventory.
 */
export const calculateMenuHPP = (
  menu: Menu,
  inventory: InventoryItem[]
): number => {
  let total = 0;
  for (const [invId, amount] of Object.entries(menu.ingredients)) {
    const inv = inventory.find((i) => i.id === invId);
    if (inv) total += inv.costPerUnit * amount;
  }
  return total;
};

/**
 * Menghitung total HPP untuk seluruh cart item pada transaksi
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
      total += calculateMenuHPP(menu, inventory) * item.quantity;
    }
  }
  return total;
};
