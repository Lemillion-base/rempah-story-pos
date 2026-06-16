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
        // BUG-M1 fix: Dynamically find the maximum queue number from today's transactions
        // to prevent race conditions or sync conflicts between multiple devices
        const todayTxs = get().transactions.filter(
          (t) => t.date.startsWith(today) && t.txStatus !== 'Demo' && t.txStatus !== 'Cancel'
        );
        const maxQueue = todayTxs.reduce((max, t) => Math.max(max, t.queueNumber || 0), 0);
        return maxQueue + 1;
      },

      addTransaction: (tx) => {
        syncTransaction(tx); // Cloud sync
        set((s) => {
          const today = getTodayDateStr();
          const todayTxs = [tx, ...s.transactions].filter(
            (t) => t.date.startsWith(today) && t.txStatus !== 'Demo' && t.txStatus !== 'Cancel'
          );
          const maxQueue = todayTxs.reduce((max, t) => Math.max(max, t.queueNumber || 0), 0);
          return {
            transactions: [tx, ...s.transactions],
            nextQueueNumber: maxQueue + 1,
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
          (t) => new Date(t.date) >= today && t.txStatus !== 'Demo' && t.txStatus !== 'Cancel'
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
          
          // Find the oldest transaction date from the cloud list to establish the sync window boundary
          let oldestCloudTime = 0;
          if (cloudTransactions.length > 0) {
            // Since it's sorted descending, the last element is the oldest
            const oldestTx = cloudTransactions[cloudTransactions.length - 1];
            oldestCloudTime = new Date(oldestTx.date).getTime();
          }

          let localOnly: Transaction[];
          if (fullSync) {
            // Full sync mode (real-time triggered): cloud is authoritative within the window.
            // Only keep local transactions created in the last 30 seconds (grace period)
            // or those older than the oldest cloud transaction (outside the sync window).
            const gracePeriod = 30 * 1000; // 30 seconds
            const cutoff = Date.now() - gracePeriod;
            localOnly = s.transactions.filter((t) => {
              if (cloudIds.has(t.id)) return false;
              const txTime = new Date(t.date).getTime();
              if (txTime > cutoff) return true; // Keep in grace period
              if (txTime > oldestCloudTime) return false; // Newer than oldest cloud but not in cloudIds -> deleted
              return true; // Keep older transactions outside the window
            });
          } else {
            // Initial load: keep local transactions only if they are older than the oldest cloud transaction
            // (if they are newer but not in cloud list, they were deleted on another device).
            localOnly = s.transactions.filter((t) => {
              if (cloudIds.has(t.id)) return false;
              const txTime = new Date(t.date).getTime();
              return txTime <= oldestCloudTime;
            });
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
