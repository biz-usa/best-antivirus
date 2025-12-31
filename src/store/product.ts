

import { create } from 'zustand';
import type { Product } from '@/lib/types';
import { produce } from 'immer';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { subDays } from 'date-fns';

interface ProductState {
  initialProducts: Product[];
  filteredProducts: Product[];
  selectedCategories: string[];
  selectedBrands: string[];
  selectedLicenseTypes: string[];
  searchTerm: string;
  onSale: boolean;
  inStock: boolean;
  newArrivals: boolean;

  setInitialProducts: (products: Product[]) => void;
  filterProducts: () => void;
  setSearchTerm: (term: string) => void;
  toggleCategory: (categorySlug: string, force?: boolean) => void;
  toggleBrand: (brand: string, force?: boolean) => void;
  toggleLicenseType: (licenseType: string, force?: boolean) => void;
  setOnSale: (value: boolean) => void;
  setInStock: (value: boolean) => void;
  setNewArrivals: (value: boolean) => void;
}

const toggleSelection = (
  currentSelection: string[],
  item: string,
  force?: boolean
): string[] => {
  const isSelected = currentSelection.includes(item);
  if (force === true) {
    return isSelected ? currentSelection : [...currentSelection, item];
  }
  if (force === false) {
    return isSelected ? currentSelection.filter((i) => i !== item) : currentSelection;
  }
  return isSelected
    ? currentSelection.filter((i) => i !== item)
    : [...currentSelection, item];
};

export const useProductStore = create<ProductState>((set, get) => ({
  initialProducts: [],
  filteredProducts: [],
  selectedCategories: [],
  selectedBrands: [],
  selectedLicenseTypes: [],
  searchTerm: '',
  onSale: false,
  inStock: false,
  newArrivals: false,

  setInitialProducts: (products) => {
    set(
      produce((draft) => {
        draft.initialProducts = products;
        draft.filteredProducts = products; // Initially, all products are shown
      })
    );
    get().filterProducts();
  },

  filterProducts: () => {
    set(
      produce((draft) => {
        const {
          initialProducts,
          selectedCategories,
          selectedBrands,
          selectedLicenseTypes,
          searchTerm,
          onSale,
          inStock,
          newArrivals,
        } = draft;

        let tempProducts = [...initialProducts];

        // Search term filter
        if (searchTerm) {
          const searchTokens = searchTerm.toLowerCase().split(' ').filter(t => t);
          if (searchTokens.length > 0) {
            tempProducts = tempProducts.filter(product => {
                const productText = [
                    product.name,
                    product.brand,
                    product.shortDescription,
                    product.category.name,
                ].join(' ').toLowerCase();

                // "Smart AND" logic: ALL search tokens must be present in the product text.
                return searchTokens.every(token => productText.includes(token));
            });
          }
        }

        // Category filter
        if (selectedCategories.length > 0) {
          tempProducts = tempProducts.filter((p) =>
            selectedCategories.includes(p.category.slug)
          );
        }

        // Brand filter
        if (selectedBrands.length > 0) {
          tempProducts = tempProducts.filter((p) =>
            selectedBrands.includes(p.brand)
          );
        }

        // License type filter
        if (selectedLicenseTypes.length > 0) {
          tempProducts = tempProducts.filter((p) =>
            selectedLicenseTypes.includes(p.licenseType)
          );
        }

        // On sale filter
        if (onSale) {
            tempProducts = tempProducts.filter(p => 
                p.variants.some(v => v.salePrice && v.salePrice < v.price)
            );
        }
        
        // In stock filter
        if (inStock) {
            tempProducts = tempProducts.filter(p => 
                p.variants.some(v => v.licenseKeys && v.licenseKeys.available.length > 0)
            );
        }

        // New arrivals filter (last 30 days)
        if (newArrivals) {
            const thirtyDaysAgo = subDays(new Date(), 30);
            tempProducts = tempProducts.filter(p => 
                p.createdAt && p.createdAt.toDate && p.createdAt.toDate() > thirtyDaysAgo
            );
        }

        draft.filteredProducts = tempProducts;
      })
    );
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().filterProducts();
  },

  toggleCategory: (categorySlug, force) => {
    set(
      produce((draft) => {
        draft.selectedCategories = toggleSelection(
          draft.selectedCategories,
          categorySlug,
          force
        );
        draft.searchTerm = '';
      })
    );
    get().filterProducts();
  },

  toggleBrand: (brand, force) => {
    set(
      produce((draft) => {
        draft.selectedBrands = toggleSelection(
          draft.selectedBrands,
          brand,
          force
        );
        draft.searchTerm = '';
      })
    );
    get().filterProducts();
  },

  toggleLicenseType: (licenseType, force) => {
    set(
      produce((draft) => {
        draft.selectedLicenseTypes = toggleSelection(
          draft.selectedLicenseTypes,
          licenseType,
          force
        );
        draft.searchTerm = '';
      })
    );
    get().filterProducts();
  },

  setOnSale: (value) => {
    set({ onSale: value, searchTerm: '' });
    get().filterProducts();
  },

  setInStock: (value) => {
    set({ inStock: value, searchTerm: '' });
    get().filterProducts();
  },

  setNewArrivals: (value) => {
    set({ newArrivals: value, searchTerm: '' });
    get().filterProducts();
  },
}));

// Hook to sync search param with store
export const useSyncSearchParam = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSearchTerm } = useProductStore();

  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams, setSearchTerm]);
};
