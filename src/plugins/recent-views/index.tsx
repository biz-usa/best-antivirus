

'use client';

import type { Product, SiteConfig } from '@/lib/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState, useCallback } from 'react';
import { ProductCard } from '@/components/product-card';
import { Eye } from 'lucide-react';
import { getSiteConfig } from '@/lib/data';
import { usePathname } from 'next/navigation';

// 1. Define the state and actions for our store
interface RecentViewsState {
  viewedProducts: Product[];
  addProduct: (product: Product) => void;
}

// 2. Create the Zustand store with persistence
const useRecentViewsStore = create<RecentViewsState>()(
  persist(
    (set, get) => ({
      viewedProducts: [],
      addProduct: (product) => {
        const { viewedProducts } = get();
        const isAlreadyViewed = viewedProducts.some((p) => p.id === product.id);

        if (!isAlreadyViewed) {
          const updatedProducts = [product, ...viewedProducts].slice(0, 4); // Keep only the latest 4
          set({ viewedProducts: updatedProducts });
        }
      },
    }),
    {
      name: 'recent-views-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 3. Create a hook to add products to the store
export const useTrackRecentView = () => {
  const addProductToStore = useRecentViewsStore((state) => state.addProduct);
  const [isEnabled, setIsEnabled] = useState(true); // Default to enabled to avoid flash of content
  const pathname = usePathname();

   useEffect(() => {
    async function checkConfig() {
        const config = await getSiteConfig();
        const pluginConfig = config.plugins?.recentViews;
        const isExcluded = pluginConfig?.excludedPages?.some(page => {
            const trimmedPage = page.trim();
            if (!trimmedPage) return false;
            return pathname.trim().startsWith(trimmedPage);
        }) ?? false;
        setIsEnabled((pluginConfig?.enabled ?? false) && !isExcluded);
    }
    checkConfig();
  }, [pathname]);

  const addProduct = useCallback((product: Product) => {
      if (isEnabled) {
          addProductToStore(product);
      }
  }, [isEnabled, addProductToStore]);


  return { addProduct };
};


// 4. Create the UI component to display recently viewed products
interface RecentViewsProps {
  currentProductId?: string;
}

export function RecentViews({ currentProductId }: RecentViewsProps) {
  const [hydrated, setHydrated] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const allViewedProducts = useRecentViewsStore((state) => state.viewedProducts);
  const pathname = usePathname();
  
  useEffect(() => {
    async function checkConfig() {
        const config = await getSiteConfig();
        const pluginConfig = config.plugins?.recentViews;
        const isExcluded = pluginConfig?.excludedPages?.some(page => {
            const trimmedPage = page.trim();
            if (!trimmedPage) return false;
            return pathname.trim().startsWith(trimmedPage);
        }) ?? false;
        setIsEnabled((pluginConfig?.enabled ?? false) && !isExcluded);
        setHydrated(true); // Ensure we are on the client side before using the persisted state
    }
    checkConfig();
  }, [pathname]);

  // Filter out the current product from the list
  const productsToShow = allViewedProducts.filter(p => p.id !== currentProductId);

  if (!hydrated || !isEnabled || productsToShow.length === 0) {
    return null; // Don't render anything if not hydrated, disabled, or no items to show
  }

  return (
    <div className="space-y-8 pt-8 border-t mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Sản phẩm đã xem gần đây
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsToShow.map((product) => (
                <ProductCard key={product.id} product={product} showPrice={true} />
            ))}
        </div>
    </div>
  );
}
