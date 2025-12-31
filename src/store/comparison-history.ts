
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProductComparisonOutput } from '@/lib/schemas/product-comparison';
import type { Product } from '@/lib/types';

// Helper to create a consistent key from product IDs
const createComparisonKey = (mainProduct: Product, competitors: Product[]): string => {
  const allIds = [mainProduct.id!, ...competitors.map(c => c.id!)];
  return allIds.sort().join('-');
};

interface ComparisonHistoryState {
  history: Record<string, ProductComparisonOutput>;
  addComparison: (mainProduct: Product, competitors: Product[], result: ProductComparisonOutput) => void;
  getComparison: (mainProduct: Product, competitors: Product[]) => ProductComparisonOutput | null;
}

export const useComparisonHistoryStore = create<ComparisonHistoryState>()(
  persist(
    (set, get) => ({
      history: {},
      addComparison: (mainProduct, competitors, result) => {
        const key = createComparisonKey(mainProduct, competitors);
        set((state) => ({
          history: {
            ...state.history,
            [key]: result,
          },
        }));
      },
      getComparison: (mainProduct, competitors) => {
        const key = createComparisonKey(mainProduct, competitors);
        return get().history[key] || null;
      },
    }),
    {
      name: 'comparison-history-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
