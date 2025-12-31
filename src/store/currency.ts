
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Currency = 'VND' | 'USD' | 'EUR';

const exchangeRates = {
  VND: 1,
  USD: 25445, // Approximate rate
  EUR: 27188, // Approximate rate
};

interface CurrencyState {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountInVnd: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selectedCurrency: 'VND',
      setCurrency: (currency) => set({ selectedCurrency: currency }),
      formatPrice: (amountInVnd) => {
        const { selectedCurrency } = get();
        const rate = exchangeRates[selectedCurrency];
        const convertedAmount = amountInVnd / rate;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency,
            minimumFractionDigits: selectedCurrency === 'VND' ? 0 : 2,
            maximumFractionDigits: selectedCurrency === 'VND' ? 0 : 2,
        }).format(convertedAmount);
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
