import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import type { User, Role } from '../types';
import { seedUsers } from '../utils/seed';
import { useAuditLogStore } from './auditLogStore';
import { syncUser, deleteUserCloud, fetchUsersFromCloud } from '../lib/cloudSync';

interface AuthState {
  users: User[];
  currentUser: User | null;
  passwordsHashed: boolean; // flag to track migration
  login: (username: string, password: string) => User | null;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getRedirectPath: (role: Role) => string;
  migratePasswords: () => void;
  loadFromCloud: () => Promise<void>;
}

const SALT_ROUNDS = 10;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      currentUser: null,
      passwordsHashed: false,

      migratePasswords: () => {
        if (get().passwordsHashed) return;
        const users = get().users.map((u) => {
          // If password doesn't start with $2a$ or $2b$, it's plain text
          if (!u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
            return { ...u, password: bcrypt.hashSync(u.password, SALT_ROUNDS) };
          }
          return u;
        });
        set({ users, passwordsHashed: true });
      },

      login: (username, password) => {
        const user = get().users.find((u) => u.username === username);
        if (!user) return null;

        // Compare with bcrypt
        let match = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          match = bcrypt.compareSync(password, user.password);
        } else {
          // Fallback for unhashed passwords (pre-migration)
          match = user.password === password;
        }

        if (match) {
          set({ currentUser: user });
          useAuditLogStore.getState().addLog(user.id, user.name, user.role, 'login', 'User logged in');
          return user;
        }
        return null;
      },

      logout: () => {
        const currentUser = get().currentUser;
        if (currentUser) {
          useAuditLogStore.getState().addLog(currentUser.id, currentUser.name, currentUser.role, 'logout', 'User logged out');
        }
        set({ currentUser: null });
      },

      addUser: (user) => {
        // Hash password before storing
        const hashedUser = {
          ...user,
          password: bcrypt.hashSync(user.password, SALT_ROUNDS),
        };
        set((s) => ({ users: [...s.users, hashedUser] }));
        syncUser(hashedUser);
      },

      updateUser: (id, data) => {
        // Hash password if it's being updated
        const updateData = { ...data };
        if (updateData.password && !updateData.password.startsWith('$2a$') && !updateData.password.startsWith('$2b$')) {
          updateData.password = bcrypt.hashSync(updateData.password, SALT_ROUNDS);
        }
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...updateData } : u)),
          currentUser:
            s.currentUser?.id === id
              ? { ...s.currentUser, ...updateData }
              : s.currentUser,
        }));
        const updated = get().users.find((u) => u.id === id);
        if (updated) syncUser(updated);
      },

      deleteUser: (id) => {
        deleteUserCloud(id);
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      },

      getRedirectPath: (role) => {
        switch (role) {
          case 'Manager':
            return '/dashboard';
          case 'Kasir':
            return '/pos';
          case 'Acaraki':
            return '/kitchen';
          default:
            return '/';
        }
      },

      loadFromCloud: async () => {
        const cloudUsers = await fetchUsersFromCloud();
        if (cloudUsers && cloudUsers.length > 0) {
          set((s) => {
            const cloudIds = new Set(cloudUsers.map((u) => u.id));
            const localOnly = s.users.filter((u) => !cloudIds.has(u.id));
            return { users: [...cloudUsers, ...localOnly] };
          });
        }
      },
    }),
    { name: 'rempah-auth' }
  )
);
