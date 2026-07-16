import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import type { AppSettings } from '../types';
import { seedSettings } from '../utils/seed';
import { syncSettings, fetchSettingsFromCloud } from '../lib/cloudSync';
import { updateFavicon, updatePageTitle } from '../utils/favicon';
import { useToastStore } from './toastStore';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (data: Partial<AppSettings>) => void;
  verifyPin: (pin: string) => boolean;
  loadFromCloud: () => Promise<void>;
}

// Helper: check if a string is already a bcrypt hash
function isBcryptHash(str: string): boolean {
  return str.startsWith('$2a$') || str.startsWith('$2b$');
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: seedSettings,

      updateSettings: (data: Partial<AppSettings>) => {
        // BUG-M4 fix: Hash PINs before storing
        const processed = { ...data };
        if (processed.managerPin && !isBcryptHash(processed.managerPin)) {
          processed.managerPin = bcrypt.hashSync(processed.managerPin, 8);
        }
        if (processed.superAdminPin && !isBcryptHash(processed.superAdminPin)) {
          processed.superAdminPin = bcrypt.hashSync(processed.superAdminPin, 8);
        }
        set((s: SettingsState) => ({ settings: { ...s.settings, ...processed } }));
        const updated = { ...get().settings, ...processed };
        syncSettings(updated);
        // Update favicon & title if logo/name changed
        if (data.storeLogo !== undefined) updateFavicon(data.storeLogo);
        if (data.storeName !== undefined) updatePageTitle(data.storeName);
      },

      // BUG-M4 fix: Compare PIN with bcrypt (supports both hashed and legacy plaintext)
      verifyPin: (pin: string) => {
        const stored = get().settings.managerPin;
        if (isBcryptHash(stored)) {
          return bcrypt.compareSync(pin, stored);
        }
        // Legacy plaintext comparison (auto-migrate)
        if (stored === pin) {
          // Migrate plaintext PIN to hash
          const hashed = bcrypt.hashSync(pin, 8);
          set((s: SettingsState) => ({ settings: { ...s.settings, managerPin: hashed } }));
          syncSettings({ ...get().settings, managerPin: hashed });
          return true;
        }
        return false;
      },

      loadFromCloud: async () => {
        const cloudSettings = await fetchSettingsFromCloud();
        if (cloudSettings) {
          // LOGIC-ERR-01 fix: Track fields where both local and cloud diverged from seed
          const conflictFields: string[] = [];

          set((s: SettingsState) => {
            const merged = { ...seedSettings } as any;
            // LOGIC-6: Merge settings per-field rather than overwriting completely
            // Local modifications and cloud modifications are both preserved if they don't conflict.
            Object.keys(seedSettings).forEach((k) => {
              const key = k as keyof AppSettings;
              const localVal = s.settings[key];
              const cloudVal = cloudSettings[key];
              const seedVal = seedSettings[key];

              const localChanged = localVal !== undefined && JSON.stringify(localVal) !== JSON.stringify(seedVal);
              const cloudChanged = cloudVal !== undefined && JSON.stringify(cloudVal) !== JSON.stringify(seedVal);

              if (localChanged && !cloudChanged) {
                merged[key] = localVal;
              } else if (!localChanged && cloudChanged) {
                merged[key] = cloudVal;
              } else if (localChanged && cloudChanged) {
                // LOGIC-ERR-01 fix: Cloud still wins, but track the conflict
                // Skip sensitive fields (PINs) and complex objects (themeShades) from notification
                if (JSON.stringify(localVal) !== JSON.stringify(cloudVal)) {
                  const skipNotify = ['managerPin', 'superAdminPin', 'themeShades'];
                  if (!skipNotify.includes(key)) {
                    conflictFields.push(key);
                  }
                }
                merged[key] = cloudVal; // Cloud wins conflict
              } else {
                merged[key] = localVal !== undefined ? localVal : seedVal;
              }
            });
            return { settings: merged as AppSettings };
          });

          // LOGIC-ERR-01 fix: Notify user if conflicts were detected
          if (conflictFields.length > 0) {
            const fieldLabels: Record<string, string> = {
              storeName: 'Nama Toko',
              storeAddress: 'Alamat Toko',
              storePhone: 'Telepon Toko',
              storeLogo: 'Logo Toko',
              taxPercent: 'Pajak (%)',
              printerEnabled: 'Printer',
              printerType: 'Tipe Printer',
              themeColor: 'Warna Tema',
            };
            const labels = conflictFields.map((f) => fieldLabels[f] || f).join(', ');
            setTimeout(() => {
              useToastStore.getState().addToast(
                `⚠️ Pengaturan "${labels}" diperbarui dari perangkat lain. Perubahan lokal Anda digantikan oleh data cloud.`,
                'warning',
                6000
              );
            }, 1500);
          }
        }
      },
    }),
    {
      name: 'rempah-settings',
      merge: (persistedState: any, currentState: any) => {
        return {
          ...currentState,
          ...persistedState,
          settings: {
            ...currentState.settings,
            ...(persistedState?.settings || {}),
          },
        };
      },
    }
  )
);
