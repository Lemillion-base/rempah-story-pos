import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';
import { seedSettings } from '../utils/seed';
import { syncSettings, fetchSettingsFromCloud } from '../lib/cloudSync';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => void;
  verifyPin: (pin: string) => boolean;
  loadFromCloud: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: seedSettings,

      updateSettings: (data) => {
        set((s) => ({ settings: { ...s.settings, ...data } }));
        // Sync to cloud after update
        const updated = { ...get().settings, ...data };
        syncSettings(updated);
      },

      verifyPin: (pin) => get().settings.managerPin === pin,

      loadFromCloud: async () => {
        const cloudSettings = await fetchSettingsFromCloud();
        if (cloudSettings) {
          set({ settings: cloudSettings });
        }
      },
    }),
    { name: 'rempah-settings' }
  )
);
