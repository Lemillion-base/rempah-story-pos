import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Menu } from '../types';
import { seedMenus } from '../utils/seed';
import { syncMenu, deleteMenuCloud, fetchMenusFromCloud } from '../lib/cloudSync';

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
  loadFromCloud: () => Promise<void>;
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

      importMenus: (menus) => set({ menus }),

      getCategories: () => {
        const fromMenus = new Set(get().menus.map((m) => m.category));
        const fromCustom = new Set(get().customCategories);
        return Array.from(new Set([...fromCustom, ...fromMenus]));
      },

      addCategory: (cat) =>
        set((s) => ({
          customCategories: s.customCategories.includes(cat)
            ? s.customCategories
            : [...s.customCategories, cat],
        })),

      deleteCategory: (cat) =>
        set((s) => ({
          customCategories: s.customCategories.filter((c) => c !== cat),
        })),

      loadFromCloud: async () => {
        const cloudMenus = await fetchMenusFromCloud();
        if (cloudMenus && cloudMenus.length > 0) {
          set((s) => {
            const cloudIds = new Set(cloudMenus.map((m) => m.id));
            // Keep local menus not yet in cloud
            const localOnly = s.menus.filter((m) => !cloudIds.has(m.id));
            return { menus: [...cloudMenus, ...localOnly] };
          });
        }
      },
    }),
    { name: 'rempah-menus' }
  )
);
