import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { AuditLogEntry, AuditAction, Role } from '../types';
import { syncAuditLog, fetchAuditLogsFromCloud } from '../lib/cloudSync';

interface AuditLogState {
  logs: AuditLogEntry[];
  addLog: (userId: string, userName: string, userRole: Role, action: AuditAction, detail: string, metadata?: Record<string, any>) => void;
  getLogsByUser: (userId: string) => AuditLogEntry[];
  getLogsByAction: (action: AuditAction) => AuditLogEntry[];
  getLogsByDateRange: (from: Date, to: Date) => AuditLogEntry[];
  clearOldLogs: (daysToKeep?: number) => void;
  loadFromCloud: () => Promise<void>;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (userId, userName, userRole, action, detail, metadata) => {
        const entry: AuditLogEntry = {
          id: uuid(),
          userId,
          userName,
          userRole,
          action,
          detail,
          timestamp: new Date().toISOString(),
          metadata,
        };
        set((s) => ({ logs: [entry, ...s.logs].slice(0, 10000) })); // Max 10000 entries
        syncAuditLog(entry);
      },

      getLogsByUser: (userId) =>
        get().logs.filter((l) => l.userId === userId),

      getLogsByAction: (action) =>
        get().logs.filter((l) => l.action === action),

      getLogsByDateRange: (from, to) =>
        get().logs.filter((l) => {
          const d = new Date(l.timestamp);
          return d >= from && d <= to;
        }),

      clearOldLogs: (daysToKeep = 90) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);
        set((s) => ({ logs: s.logs.filter((l) => new Date(l.timestamp) >= cutoff) }));
      },

      // BUG-C4 fix: Load audit logs from cloud for multi-device visibility
      loadFromCloud: async () => {
        const cloudLogs = await fetchAuditLogsFromCloud();
        if (cloudLogs && cloudLogs.length > 0) {
          set((s) => {
            const cloudIds = new Set(cloudLogs.map((l) => l.id));
            const localOnly = s.logs.filter((l) => !cloudIds.has(l.id));
            const merged = [...cloudLogs, ...localOnly];
            merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return { logs: merged.slice(0, 10000) };
          });
        }
      },
    }),
    { name: 'rempah-audit-logs' }
  )
);
