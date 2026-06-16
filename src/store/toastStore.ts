import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;
// Track active timeouts to prevent memory leaks when toasts are removed manually
const activeTimeouts = new Map<string, number>();

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (message, type = 'success', duration = 3000) => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
    
    if (duration > 0) {
      const timer = window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        activeTimeouts.delete(id);
      }, duration);
      activeTimeouts.set(id, timer);
    }
  },

  removeToast: (id) => {
    const timer = activeTimeouts.get(id);
    if (timer) {
      clearTimeout(timer);
      activeTimeouts.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
