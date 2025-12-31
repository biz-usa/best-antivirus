

'use client';

import type { Product } from '@/lib/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getSiteConfig } from '@/lib/data';
import { usePathname } from 'next/navigation';

// 1. Define the state shape
interface WishlistState {
  wishlists: Record<string, Product[]>; // Keyed by user ID, or 'guest'
  addToWishlist: (userId: string, product: Product) => void;
  removeFromWishlist: (userId: string, productId: string) => void;
  isProductInWishlist: (userId: string, productId: string) => boolean;
}

// 2. Create the Zustand store with persistence
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlists: {},
      addToWishlist: (userId, product) => {
        const { wishlists } = get();
        const userWishlist = wishlists[userId] || [];
        if (!userWishlist.some(p => p.id === product.id)) {
          const updatedWishlist = [product, ...userWishlist];
          set({
            wishlists: { ...wishlists, [userId]: updatedWishlist },
          });
        }
      },
      removeFromWishlist: (userId, productId) => {
        const { wishlists } = get();
        const userWishlist = wishlists[userId] || [];
        const updatedWishlist = userWishlist.filter((p) => p.id !== productId);
        set({
          wishlists: { ...wishlists, [userId]: updatedWishlist },
        });
      },
      isProductInWishlist: (userId, productId) => {
        const { wishlists } = get();
        const userWishlist = wishlists[userId] || [];
        return userWishlist.some((p) => p.id === productId);
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 3. Create the UI component
interface WishlistButtonProps {
  product: Product;
  className?: string;
}

export function WishlistButton({ product, className }: WishlistButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const store = useWishlistStore();
  const [isClient, setIsClient] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    async function checkConfig() {
        const config = await getSiteConfig();
        const pluginConfig = config.plugins?.wishlist;
        const isExcluded = pluginConfig?.excludedPages?.some(page => {
            const trimmedPage = page.trim();
            if (!trimmedPage) return false;
            return pathname.trim().startsWith(trimmedPage);
        }) ?? false;
        setIsEnabled((pluginConfig?.enabled ?? false) && !isExcluded);
    }
    checkConfig();
  }, [pathname]);

  const userId = user?.uid || 'guest';
  const isInWishlist = store.isProductInWishlist(userId, product.id!);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();

    if (!user) {
        toast({
            variant: "destructive",
            title: "Vui lòng đăng nhập",
            description: "Bạn cần đăng nhập để sử dụng chức năng này.",
        });
        return;
    }

    if (isInWishlist) {
      store.removeFromWishlist(userId, product.id!);
      toast({ title: "Đã xóa khỏi danh sách yêu thích" });
    } else {
      store.addToWishlist(userId, product);
      toast({ title: "Đã thêm vào danh sách yêu thích" });
    }
  };

  if (!isClient || !isEnabled) {
    return null; // Don't render on server or if disabled
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "rounded-full h-8 w-8 bg-background/60 hover:bg-background",
        className
      )}
      onClick={handleToggleWishlist}
    >
      <Heart className={cn(
          "h-4 w-4 text-muted-foreground",
          isInWishlist && "fill-red-500 text-red-500"
      )} />
      <span className="sr-only">Thêm vào danh sách yêu thích</span>
    </Button>
  );
}
