import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { InventoryItem } from '../types';
import { seedInventory } from '../utils/seed';
import { useStockLogStore } from './stockLogStore';
import { syncInventoryItem, syncInventoryDeduction, deleteInventoryCloud } from '../lib/cloudSync';

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  deductStock: (deductions: Record<string, number>, reason?: string) => void;
  getLowStockItems: () => InventoryItem[];
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: seedInventory,

      addItem: (item) => {
        syncInventoryItem(item); // Cloud sync
        set((s) => ({ items: [...s.items, item] }));
      },

      updateItem: (id, data) => {
        const current = get().items.find((i) => i.id === id);
        // Log stock change if stock was manually adjusted
        if (current && data.stock !== undefined && data.stock !== current.stock) {
          useStockLogStore.getState().addLog({
            id: uuid(),
            inventoryId: id,
            inventoryName: current.name,
            type: 'adjust',
            amount: data.stock - current.stock,
            stockBefore: current.stock,
            stockAfter: data.stock,
            unit: current.unit,
            reason: 'Adjustment manual',
            date: new Date().toISOString(),
          });
        }
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
        }));
        // Cloud sync the updated item
        const updated = get().items.find((i) => i.id === id);
        if (updated) syncInventoryItem(updated);
      },

      deleteItem: (id) => {
        deleteInventoryCloud(id); // Cloud sync
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      deductStock: (deductions, reason) => {
        const items = get().items;
        // Log each deduction
        for (const [invId, amount] of Object.entries(deductions)) {
          const item = items.find((i) => i.id === invId);
          if (item && amount > 0) {
            useStockLogStore.getState().addLog({
              id: uuid(),
              inventoryId: invId,
              inventoryName: item.name,
              type: 'deduct',
              amount: -amount,
              stockBefore: item.stock,
              stockAfter: Math.max(0, item.stock - amount),
              unit: item.unit,
              reason: reason || 'Transaksi POS',
              date: new Date().toISOString(),
            });
          }
        }
        set((s) => ({
          items: s.items.map((i) => {
            const amount = deductions[i.id];
            if (amount) return { ...i, stock: Math.max(0, i.stock - amount) };
            return i;
          }),
        }));
        // Cloud sync deductions
        syncInventoryDeduction(deductions, items);
      },

      getLowStockItems: () => {
        return get().items.filter((i) => i.stock < (i.minStock ?? 3));
      },
    }),
    { name: 'rempah-inventory' }
  )
);
