import type { CartItem, Menu, InventoryItem } from '../types';

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
 */
export function checkStockAvailability(
  cartItems: CartItem[],
  menus: Menu[],
  inventory: InventoryItem[]
): StockWarning[] {
  // Calculate total required per ingredient
  const required: Record<string, number> = {};

  for (const item of cartItems) {
    const menu = menus.find((m) => m.id === item.menuId);
    if (!menu) continue;
    for (const [invId, amount] of Object.entries(menu.ingredients)) {
      required[invId] = (required[invId] || 0) + amount * item.quantity;
    }
  }

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
