import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';
import { seedSettings } from '../utils/seed';
import { syncSettings, fetchSettingsFromCloud } from '../lib/cloudSync';
import { updateFavicon, updatePageTitle } from '../utils/favicon';

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
        const updated = { ...get().settings, ...data };
        syncSettings(updated);
        // Update favicon & title if logo/name changed
        if (data.storeLogo !== undefined) updateFavicon(data.storeLogo);
        if (data.storeName !== undefined) updatePageTitle(data.storeName);
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
