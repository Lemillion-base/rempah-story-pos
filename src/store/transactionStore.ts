import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, KitchenStatus, TxStatus } from '../types';
import { syncTransaction, syncTransactionStatus, syncTransactionTxStatus, deleteTransactionCloud } from '../lib/cloudSync';

interface TransactionState {
  transactions: Transaction[];
  nextQueueNumber: number;
  lastQueueDate: string | null;
  lastKdsClearTime: string | null;
  addTransaction: (tx: Transaction) => void;
  updateKitchenStatus: (id: string, status: KitchenStatus) => void;
  updateTxStatus: (id: string, status: TxStatus) => void;
  deleteTransaction: (id: string) => void;
  getTodayTransactions: () => Transaction[];
  getActiveKitchenOrders: () => Transaction[];
  clearKdsDoneOrders: () => void;
  getNextQueueNumber: () => number;
  loadFromCloud: (transactions: Transaction[], fullSync?: boolean) => void;
}

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      nextQueueNumber: 1,
      lastQueueDate: null,
      lastKdsClearTime: null,

      getNextQueueNumber: () => {
        const today = getTodayDateStr();
        const state = get();
        // Reset queue number if it's a new day
        if (state.lastQueueDate !== today) {
          set({ nextQueueNumber: 1, lastQueueDate: today });
          return 1;
        }
        return state.nextQueueNumber;
      },

      addTransaction: (tx) => {
        syncTransaction(tx); // Cloud sync
        set((s) => {
          const today = getTodayDateStr();
          const shouldReset = s.lastQueueDate !== today;
          return {
            transactions: [tx, ...s.transactions],
            nextQueueNumber: (shouldReset ? 1 : s.nextQueueNumber) + 1,
            lastQueueDate: today,
          };
        });
      },

      updateKitchenStatus: (id, status) => {
        syncTransactionStatus(id, status); // Cloud sync
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, kitchenStatus: status } : t
          ),
        }));
      },

      updateTxStatus: (id, status) => {
        syncTransactionTxStatus(id, status); // Cloud sync
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, txStatus: status } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        deleteTransactionCloud(id); // Cloud sync
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
      },

      getTodayTransactions: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().transactions.filter(
          (t) => new Date(t.date) >= today && t.txStatus !== 'Demo'
        );
      },

      getActiveKitchenOrders: () => {
        return get().transactions.filter(
          (t) =>
            t.kitchenStatus !== 'Done' &&
            t.txStatus === 'Selesai'
        );
      },

      clearKdsDoneOrders: () => set({ lastKdsClearTime: new Date().toISOString() }),

      loadFromCloud: (cloudTransactions, fullSync = false) => {
        set((s) => {
          const cloudIds = new Set(cloudTransactions.map((t) => t.id));
          
          let localOnly: Transaction[];
          if (fullSync) {
            // Full sync mode (real-time triggered): cloud is authoritative.
            // Only keep local transactions created in the last 30 seconds
            // (grace period for transactions that haven't synced to cloud yet)
            const gracePeriod = 30 * 1000; // 30 seconds
            const cutoff = Date.now() - gracePeriod;
            localOnly = s.transactions.filter(
              (t) => !cloudIds.has(t.id) && new Date(t.date).getTime() > cutoff
            );
          } else {
            // Initial load: keep all local transactions not in cloud
            localOnly = s.transactions.filter((t) => !cloudIds.has(t.id));
          }

          // Merge: cloud data + local-only data
          const merged = [...cloudTransactions, ...localOnly];
          // Sort by date descending (newest first)
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // BUG-02 fix: Recalculate nextQueueNumber from merged data
          // to prevent duplicate queue numbers across devices
          const today = getTodayDateStr();
          const todayTxs = merged.filter((t) => t.date.startsWith(today));
          const maxQueue = todayTxs.reduce((max, t) => Math.max(max, t.queueNumber || 0), 0);
          const newNextQueue = Math.max(s.nextQueueNumber, maxQueue + 1);

          return {
            transactions: merged,
            nextQueueNumber: newNextQueue,
            lastQueueDate: today,
          };
        });
      },
    }),
    { name: 'rempah-transactions' }
  )
);
