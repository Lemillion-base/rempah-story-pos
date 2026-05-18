import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Promo, LoyaltySettings } from '../types';
import { syncPromo, deletePromoCloud, fetchPromosFromCloud } from '../lib/cloudSync';

interface PromoState {
  promos: Promo[];
  loyaltySettings: LoyaltySettings;
  addPromo: (promo: Promo) => void;
  updatePromo: (id: string, data: Partial<Promo>) => void;
  deletePromo: (id: string) => void;
  incrementUsage: (id: string) => void;
  getActivePromos: () => Promo[];
  getPromoByCode: (code: string) => Promo | undefined;
  updateLoyaltySettings: (data: Partial<LoyaltySettings>) => void;
  getCustomerTier: (visitCount: number) => 'none' | 'bronze' | 'silver' | 'gold';
  getCustomerDiscount: (visitCount: number) => number;
  loadFromCloud: () => Promise<void>;
}

export const usePromoStore = create<PromoState>()(
  persist(
    (set, get) => ({
      promos: [],
      loyaltySettings: {
        enabled: false,
        pointsPerTransaction: 1,
        pointsPerRupiah: 10000,
        redeemPointsValue: 1000,
        tierBronzeMinVisits: 5,
        tierSilverMinVisits: 15,
        tierGoldMinVisits: 30,
        tierBronzeDiscount: 5,
        tierSilverDiscount: 10,
        tierGoldDiscount: 15,
      },

      addPromo: (promo) => {
        set((s) => ({ promos: [...s.promos, promo] }));
        syncPromo(promo);
      },

      updatePromo: (id, data) => {
        set((s) => ({
          promos: s.promos.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
        const updated = get().promos.find((p) => p.id === id);
        if (updated) syncPromo(updated);
      },

      deletePromo: (id) => {
        deletePromoCloud(id);
        set((s) => ({ promos: s.promos.filter((p) => p.id !== id) }));
      },

      incrementUsage: (id) => {
        set((s) => ({
          promos: s.promos.map((p) =>
            p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p
          ),
        }));
        const updated = get().promos.find((p) => p.id === id);
        if (updated) syncPromo(updated);
      },

      getActivePromos: () => {
        const now = new Date();
        return get().promos.filter(
          (p) =>
            p.isActive &&
            new Date(p.startDate) <= now &&
            new Date(p.endDate) >= now &&
            (!p.usageLimit || p.usageCount < p.usageLimit)
        );
      },

      getPromoByCode: (code) => {
        const now = new Date();
        return get().promos.find(
          (p) =>
            p.code?.toLowerCase() === code.toLowerCase() &&
            p.isActive &&
            new Date(p.startDate) <= now &&
            new Date(p.endDate) >= now &&
            (!p.usageLimit || p.usageCount < p.usageLimit)
        );
      },

      updateLoyaltySettings: (data) =>
        set((s) => ({ loyaltySettings: { ...s.loyaltySettings, ...data } })),

      getCustomerTier: (visitCount) => {
        const ls = get().loyaltySettings;
        if (!ls.enabled) return 'none';
        if (visitCount >= ls.tierGoldMinVisits) return 'gold';
        if (visitCount >= ls.tierSilverMinVisits) return 'silver';
        if (visitCount >= ls.tierBronzeMinVisits) return 'bronze';
        return 'none';
      },

      getCustomerDiscount: (visitCount) => {
        const ls = get().loyaltySettings;
        if (!ls.enabled) return 0;
        const tier = get().getCustomerTier(visitCount);
        switch (tier) {
          case 'gold': return ls.tierGoldDiscount;
          case 'silver': return ls.tierSilverDiscount;
          case 'bronze': return ls.tierBronzeDiscount;
          default: return 0;
        }
      },

      loadFromCloud: async () => {
        const cloudPromos = await fetchPromosFromCloud();
        if (cloudPromos && cloudPromos.length > 0) {
          set((s) => {
            const cloudIds = new Set(cloudPromos.map((p) => p.id));
            const localOnly = s.promos.filter((p) => !cloudIds.has(p.id));
            return { promos: [...cloudPromos, ...localOnly] };
          });
        }
      },
    }),
    { name: 'rempah-promos' }
  )
);
