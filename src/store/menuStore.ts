import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Menu } from '../types';
import { seedMenus } from '../utils/seed';
import { syncMenu, deleteMenuCloud, fetchMenusFromCloud, syncCustomCategories, fetchCustomCategoriesFromCloud } from '../lib/cloudSync';

import { useAuditLogStore } from './auditLogStore';
import { useAuthStore } from './authStore';

interface MenuState {
  menus: Menu[];
  customCategories: string[];
  addMenu: (menu: Menu) => void;
  updateMenu: (id: string, data: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  importMenus: (menus: Menu[]) => void;
  getCategories: () => string[];
  addCategory: (cat: string) => void;
  deleteCategory: (cat: string) => void;
  loadFromCloud: (fullSync?: boolean) => Promise<void>;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      menus: seedMenus,
      customCategories: ['Jamu Murni', 'Wedang', 'Signature', 'Segar'],

      addMenu: (menu) => {
        set((s) => ({ menus: [...s.menus, menu] }));
        syncMenu(menu);
      },

      updateMenu: (id, data) => {
        set((s) => ({
          menus: s.menus.map((m) => (m.id === id ? { ...m, ...data } : m)),
        }));
        const updatedMenu = get().menus.find((m) => m.id === id);
        if (updatedMenu) syncMenu(updatedMenu);
      },

      deleteMenu: (id) => {
        deleteMenuCloud(id);
        set((s) => ({ menus: s.menus.filter((m) => m.id !== id) }));
      },

      importMenus: (menus) => {
        set({ menus });
        // Sync all imported menus to cloud
        for (const menu of menus) {
          syncMenu(menu);
        }
        // Audit log (GAP-5 fix)
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuditLogStore.getState().addLog(
            currentUser.id,
            currentUser.name,
            currentUser.role,
            'update_menu',
            `Import menu dari CSV (${menus.length} menu)`,
            { count: menus.length }
          );
        }
      },

      getCategories: () => {
        const fromMenus = new Set(get().menus.map((m) => m.category));
        const fromCustom = new Set(get().customCategories);
        return Array.from(new Set([...fromCustom, ...fromMenus]));
      },

      addCategory: (cat) => {
        set((s) => {
          const updated = s.customCategories.includes(cat)
            ? s.customCategories
            : [...s.customCategories, cat];
          syncCustomCategories(updated); // GAP-1 fix: sync to cloud
          return { customCategories: updated };
        });
      },

      deleteCategory: (cat) => {
        set((s) => {
          const updated = s.customCategories.filter((c) => c !== cat);
          syncCustomCategories(updated); // GAP-1 fix: sync to cloud
          return { customCategories: updated };
        });
      },

      loadFromCloud: async (fullSync = false) => {
        // Load menus
        const cloudMenus = await fetchMenusFromCloud();
        if (cloudMenus !== null) {
          if (cloudMenus.length > 0) {
            set((s) => {
              const cloudIds = new Set(cloudMenus.map((m) => m.id));
              let localOnly: Menu[];
              if (fullSync) {
                localOnly = []; // In fullSync, trust cloud completely for menus
              } else {
                localOnly = s.menus.filter((m) => !cloudIds.has(m.id));
              }
              return { menus: [...cloudMenus, ...localOnly] };
            });
          } else {
            // Cloud is empty, seed it with local menus
            const localMenus = get().menus;
            for (const menu of localMenus) {
              await syncMenu(menu);
            }
          }
        }

        // GAP-1 fix: Load custom categories from cloud
        const cloudCategories = await fetchCustomCategoriesFromCloud();
        if (cloudCategories !== null) {
          if (cloudCategories.length > 0) {
            set({ customCategories: cloudCategories });
          } else {
            // Cloud is empty, sync local custom categories
            const localCategories = get().customCategories;
            await syncCustomCategories(localCategories);
          }
        }
      },
    }),
    { name: 'rempah-menus' }
  )
);
