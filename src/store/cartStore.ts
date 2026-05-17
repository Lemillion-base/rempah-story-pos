import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  discount: number;
  addItem: (item: CartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (item) => set((s) => ({ items: [...s.items, item] })),

      removeItem: (lineId) =>
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),

      updateQuantity: (lineId, qty) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.lineId !== lineId) return i;
            const unitPrice = i.basePrice + i.addons.reduce((a, b) => a + b.price, 0);
            return { ...i, quantity: qty, subtotal: unitPrice * qty };
          }),
        })),

      setDiscount: (amount) => set({ discount: amount }),

      clearCart: () => set({ items: [], discount: 0 }),

      getSubtotal: () => get().items.reduce((a, b) => a + b.subtotal, 0),

      getTotal: () => {
        const sub = get().items.reduce((a, b) => a + b.subtotal, 0);
        return Math.max(0, sub - get().discount);
      },
    }),
    { name: 'rempah-cart' }
  )
);
