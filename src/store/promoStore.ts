import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Promo, LoyaltySettings } from '../types';

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

      addPromo: (promo) => set((s) => ({ promos: [...s.promos, promo] })),

      updatePromo: (id, data) =>
        set((s) => ({
          promos: s.promos.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePromo: (id) =>
        set((s) => ({ promos: s.promos.filter((p) => p.id !== id) })),

      incrementUsage: (id) =>
        set((s) => ({
          promos: s.promos.map((p) =>
            p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p
          ),
        })),

      getActivePromos: () => {
        const now = new Date().toISOString();
        return get().promos.filter(
          (p) =>
            p.isActive &&
            p.startDate <= now &&
            p.endDate >= now &&
            (!p.usageLimit || p.usageCount < p.usageLimit)
        );
      },

      getPromoByCode: (code) => {
        const now = new Date().toISOString();
        return get().promos.find(
          (p) =>
            p.code?.toLowerCase() === code.toLowerCase() &&
            p.isActive &&
            p.startDate <= now &&
            p.endDate >= now &&
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
    }),
    { name: 'rempah-promos' }
  )
);
