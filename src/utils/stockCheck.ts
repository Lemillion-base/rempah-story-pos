import type { CartItem, Menu, InventoryItem } from '../types';
import { calculateItemDeductions } from './hpp';

export interface StockWarning {
  ingredientId: string;
  ingredientName: string;
  required: number;
  available: number;
  unit: string;
}

/**
 * Check if there's enough stock for all items in the cart.
 * Returns array of warnings for ingredients that don't have enough stock.
 * BUG-04 fix: Uses calculateItemDeductions to include addon ingredients.
 */
export function checkStockAvailability(
  cartItems: CartItem[],
  menus: Menu[],
  inventory: InventoryItem[]
): StockWarning[] {
  // Calculate total required per ingredient (menu + addons)
  const required = calculateItemDeductions(cartItems, menus);

  // Check against available stock
  const warnings: StockWarning[] = [];
  for (const [invId, needed] of Object.entries(required)) {
    const inv = inventory.find((i) => i.id === invId);
    if (!inv) continue;
    if (inv.stock < needed) {
      warnings.push({
        ingredientId: invId,
        ingredientName: inv.name,
        required: needed,
        available: inv.stock,
        unit: inv.unit,
      });
    }
  }

  return warnings;
}
