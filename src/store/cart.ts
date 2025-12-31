
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartState, CartItem, Product, ProductVariant, Discount, UserProfile } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { VAT_RATE } from '@/lib/constants';
import { getUserProfile } from '@/lib/data';
import { DEFAULT_LOYALTY_TIERS as LOYALTY_TIERS } from '@/lib/constants';

// Helper to get loyalty discount percentage
const getLoyaltyDiscountPercentage = (userProfile: UserProfile | null): number => {
    if (!userProfile?.loyaltyTier) return 0;
    
    const tierKey = Object.keys(LOYALTY_TIERS).find(key => LOYALTY_TIERS[key as keyof typeof LOYALTY_TIERS].name === userProfile.loyaltyTier);
    if (!tierKey) return 0;
    
    return LOYALTY_TIERS[tierKey as keyof typeof LOYALTY_TIERS].discountPercentage / 100;
};


export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      appliedDiscount: null,
      userProfile: null,

      fetchUserProfile: async (uid: string) => {
        try {
            const profile = await getUserProfile(uid);
            set({ userProfile: profile });
        } catch (error) {
            console.error("Failed to fetch user profile for cart:", error);
            set({ userProfile: null });
        }
      },
      clearUserProfile: () => set({ userProfile: null }),

      addItem: (product: Product, variant: ProductVariant) => {
        const { items } = get();
        const cartItemId = `${product.id}-${variant.id}`;
        const itemInCart = items.find((item) => item.id === cartItemId);

        if (itemInCart) {
          const updatedItems = items.map((item) =>
            item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
          );
          set({ items: updatedItems });
        } else {
          const newItem: CartItem = {
            ...product,
            id: cartItemId,
            selectedVariant: variant,
            quantity: 1
          };
          set({ items: [...items, newItem] });
        }
         toast({
            title: "Đã thêm vào giỏ hàng",
            description: `"${product.name} - ${variant.name}" đã được thêm vào giỏ hàng của bạn.`,
        });
        set({ isCartOpen: true });
      },
      removeItem: (cartItemId: string) => {
        set({ items: get().items.filter((item) => item.id !== cartItemId) });
         toast({
            title: "Đã xóa sản phẩm",
            description: `Sản phẩm đã được xóa khỏi giỏ hàng.`,
        })
      },
      setItemQuantity: (cartItemId: string, quantity: number) => {
        if (quantity < 1) {
            get().removeItem(cartItemId);
        } else {
            set({
                items: get().items.map((item) =>
                    item.id === cartItemId ? { ...item, quantity } : item
                ),
            });
        }
      },
      clearCart: () => set({ items: [], appliedDiscount: null }),
      setCartOpen: (isOpen: boolean) => set({ isCartOpen: isOpen }),
      applyDiscount: (discount: Discount) => set({ appliedDiscount: discount }),
      removeDiscount: () => set({ appliedDiscount: null }),
      
      // Calculation Functions
      totalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.selectedVariant.salePrice || item.selectedVariant.price;
          return total + (price * item.quantity);
        }, 0);
      },
      loyaltyDiscountAmount: () => {
        const { userProfile, totalPrice } = get();
        // Manual discount codes take priority over loyalty discounts
        if (get().appliedDiscount) return 0;

        const loyaltyDiscountRate = getLoyaltyDiscountPercentage(userProfile);
        if (loyaltyDiscountRate > 0) {
            return totalPrice() * loyaltyDiscountRate;
        }
        return 0;
      },
      manualDiscountAmount: () => {
        const { appliedDiscount, totalPrice } = get();
        if (!appliedDiscount) return 0;
        
        const subtotal = totalPrice();
        if (appliedDiscount.type === 'percentage') {
            return subtotal * (appliedDiscount.value / 100);
        }
        if (appliedDiscount.type === 'fixed') {
            return Math.min(appliedDiscount.value, subtotal);
        }
        return 0;
      },
      discountAmount: () => {
        // This function now returns the total effective discount
        return get().manualDiscountAmount() + get().loyaltyDiscountAmount();
      },
      subtotalAfterDiscount: () => {
        const { totalPrice, discountAmount } = get();
        return totalPrice() - discountAmount();
      },
      vat: () => {
        return get().subtotalAfterDiscount() * VAT_RATE;
      },
      totalWithVat: () => {
        return get().subtotalAfterDiscount() + get().vat();
      },
      cartCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        items: state.items, 
        appliedDiscount: state.appliedDiscount,
        // We don't persist userProfile as it should be fetched on load
      }),
    }
  )
);
