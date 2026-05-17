import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StockLogType = 'deduct' | 'add' | 'adjust' | 'import';

export interface StockLogEntry {
  id: string;
  inventoryId: string;
  inventoryName: string;
  type: StockLogType;
  amount: number; // positive = added, negative = deducted
  stockBefore: number;
  stockAfter: number;
  unit: string;
  reason?: string; // e.g. "Transaksi #5", "Adjustment manual"
  date: string; // ISO
}

interface StockLogState {
  logs: StockLogEntry[];
  addLog: (entry: StockLogEntry) => void;
  getLogsByItem: (inventoryId: string) => StockLogEntry[];
  clearOldLogs: (daysToKeep?: number) => void;
}

export const useStockLogStore = create<StockLogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (entry) =>
        set((s) => ({ logs: [entry, ...s.logs].slice(0, 5000) })), // Keep max 5000 entries

      getLogsByItem: (inventoryId) =>
        get().logs.filter((l) => l.inventoryId === inventoryId),

      clearOldLogs: (daysToKeep = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);
        set((s) => ({ logs: s.logs.filter((l) => new Date(l.date) >= cutoff) }));
      },
    }),
    { name: 'rempah-stock-logs' }
  )
);
