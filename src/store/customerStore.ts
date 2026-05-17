import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '../types';
import { syncCustomer, deleteCustomerCloud } from '../lib/cloudSync';

interface CustomerState {
  customers: Customer[];
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordVisit: (id: string, amount: number) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],

      addCustomer: (c) => {
        set((s) => ({ customers: [...s.customers, c] }));
        syncCustomer(c);
      },

      updateCustomer: (id, data) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        }));
        const updated = get().customers.find((c) => c.id === id);
        if (updated) syncCustomer(updated);
      },

      deleteCustomer: (id) => {
        deleteCustomerCloud(id);
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
      },

      recordVisit: (id, amount) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id
              ? {
                  ...c,
                  visitCount: c.visitCount + 1,
                  totalSpent: c.totalSpent + amount,
                  lastVisit: new Date().toISOString(),
                }
              : c
          ),
        }));
        const updated = get().customers.find((c) => c.id === id);
        if (updated) syncCustomer(updated);
      },
    }),
    { name: 'rempah-customers' }
  )
);
