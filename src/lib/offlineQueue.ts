/**
 * Offline Queue — Stores failed cloud sync operations and retries when online.
 * 
 * Strategy:
 * - Every cloud sync call goes through this queue
 * - If online: execute immediately
 * - If offline or fails: store in queue (localStorage)
 * - When internet returns: flush queue (retry all pending operations)
 * - Listens to browser online/offline events
 */

import { supabase, isSupabaseConfigured } from './supabase';

export type QueueOperation = {
  id: string;
  table: string;
  action: 'upsert' | 'update' | 'delete' | 'insert';
  data: Record<string, any>;
  filter?: { column: string; value: string }; // for update/delete
  timestamp: string;
  retries: number;
};

const QUEUE_KEY = 'rempah-offline-queue';
const MAX_RETRIES = 5;

// ============================================================
// QUEUE MANAGEMENT
// ============================================================

function getQueue(): QueueOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(op: Omit<QueueOperation, 'id' | 'timestamp' | 'retries'>) {
  const queue = getQueue();
  
  // BUG-M8 fix: Deduplicate — for upsert/update, replace existing pending op for same table+record
  const recordId = op.data?.id || op.filter?.value;
  if (recordId && (op.action === 'upsert' || op.action === 'update')) {
    const existingIdx = queue.findIndex(
      (q) => q.table === op.table && 
             (q.action === 'upsert' || q.action === 'update') &&
             (q.data?.id === recordId || q.filter?.value === recordId)
    );
    if (existingIdx !== -1) {
      // Replace the stale operation with the latest data
      queue[existingIdx] = {
        ...queue[existingIdx],
        data: op.action === 'update' ? { ...queue[existingIdx].data, ...op.data } : op.data,
        filter: op.filter || queue[existingIdx].filter,
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      saveQueue(queue);
      updateQueueCount();
      return;
    }
  }

  queue.push({
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    retries: 0,
  });
  saveQueue(queue);
  updateQueueCount();
}

export function getQueueLength(): number {
  return getQueue().length;
}

// ============================================================
// FLUSH QUEUE (retry pending operations)
// ============================================================

let isFlushing = false;

export async function flushQueue(): Promise<{ success: number; failed: number }> {
  if (!isSupabaseConfigured || isFlushing) return { success: 0, failed: 0 };
  
  isFlushing = true;
  const queue = getQueue();
  if (queue.length === 0) { isFlushing = false; return { success: 0, failed: 0 }; }

  console.log(`[OfflineQueue] Flushing ${queue.length} pending operations...`);

  let success = 0;
  let failed = 0;
  const remaining: QueueOperation[] = [];

  for (const op of queue) {
    try {
      let error: any = null;

      switch (op.action) {
        case 'upsert':
          ({ error } = await supabase.from(op.table).upsert(op.data));
          break;
        case 'insert':
          ({ error } = await supabase.from(op.table).insert(op.data));
          break;
        case 'update':
          if (op.filter) {
            ({ error } = await supabase.from(op.table).update(op.data).eq(op.filter.column, op.filter.value));
          }
          break;
        case 'delete':
          if (op.filter) {
            ({ error } = await supabase.from(op.table).delete().eq(op.filter.column, op.filter.value));
          }
          break;
      }

      if (error) {
        op.retries++;
        if (op.retries < MAX_RETRIES) {
          remaining.push(op);
        }
        failed++;
        console.warn(`[OfflineQueue] Failed (attempt ${op.retries}):`, op.table, error.message);
      } else {
        success++;
      }
    } catch (e) {
      op.retries++;
      if (op.retries < MAX_RETRIES) {
        remaining.push(op);
      }
      failed++;
    }
  }

  saveQueue(remaining);
  updateQueueCount();
  isFlushing = false;

  console.log(`[OfflineQueue] Done. Success: ${success}, Failed: ${failed}, Remaining: ${remaining.length}`);
  return { success, failed };
}

// ============================================================
// ONLINE/OFFLINE LISTENER
// ============================================================

let initialized = false;
let onQueueChange: ((count: number) => void) | null = null;

export function setQueueChangeListener(listener: (count: number) => void) {
  onQueueChange = listener;
}

function updateQueueCount() {
  if (onQueueChange) onQueueChange(getQueue().length);
}

export function initOfflineQueue() {
  if (initialized) return;
  initialized = true;

  // Flush when coming back online
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Back online — flushing queue...');
    setTimeout(flushQueue, 2000); // Small delay to let connection stabilize
  });

  // Log when going offline
  window.addEventListener('offline', () => {
    console.log('[OfflineQueue] Device went offline. Operations will be queued.');
  });

  // Try to flush on init (in case there are pending items from last session)
  if (navigator.onLine) {
    setTimeout(flushQueue, 3000);
  }
}

// ============================================================
// SMART SYNC — wraps supabase calls with offline fallback
// ============================================================

export async function smartUpsert(table: string, data: Record<string, any>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  if (!navigator.onLine) {
    addToQueue({ table, action: 'upsert', data });
    return false;
  }

  try {
    const { error } = await supabase.from(table).upsert(data);
    if (error) {
      console.warn(`[SmartSync] Upsert failed, queuing:`, error.message);
      addToQueue({ table, action: 'upsert', data });
      return false;
    }
    return true;
  } catch {
    addToQueue({ table, action: 'upsert', data });
    return false;
  }
}

export async function smartUpdate(table: string, data: Record<string, any>, column: string, value: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  if (!navigator.onLine) {
    addToQueue({ table, action: 'update', data, filter: { column, value } });
    return false;
  }

  try {
    const { error } = await supabase.from(table).update(data).eq(column, value);
    if (error) {
      addToQueue({ table, action: 'update', data, filter: { column, value } });
      return false;
    }
    return true;
  } catch {
    addToQueue({ table, action: 'update', data, filter: { column, value } });
    return false;
  }
}

export async function smartDelete(table: string, column: string, value: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  if (!navigator.onLine) {
    addToQueue({ table, action: 'delete', data: {}, filter: { column, value } });
    return false;
  }

  try {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) {
      addToQueue({ table, action: 'delete', data: {}, filter: { column, value } });
      return false;
    }
    return true;
  } catch {
    addToQueue({ table, action: 'delete', data: {}, filter: { column, value } });
    return false;
  }
}

export async function smartInsert(table: string, data: Record<string, any>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  if (!navigator.onLine) {
    addToQueue({ table, action: 'insert', data });
    return false;
  }

  try {
    const { error } = await supabase.from(table).insert(data);
    if (error) {
      addToQueue({ table, action: 'insert', data });
      return false;
    }
    return true;
  } catch {
    addToQueue({ table, action: 'insert', data });
    return false;
  }
}
