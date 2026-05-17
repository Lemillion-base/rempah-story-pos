import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { AuditLogEntry, AuditAction, Role } from '../types';
import { syncAuditLog } from '../lib/cloudSync';

interface AuditLogState {
  logs: AuditLogEntry[];
  addLog: (userId: string, userName: string, userRole: Role, action: AuditAction, detail: string, metadata?: Record<string, any>) => void;
  getLogsByUser: (userId: string) => AuditLogEntry[];
  getLogsByAction: (action: AuditAction) => AuditLogEntry[];
  getLogsByDateRange: (from: Date, to: Date) => AuditLogEntry[];
  clearOldLogs: (daysToKeep?: number) => void;
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
    }),
    { name: 'rempah-audit-logs' }
  )
);
