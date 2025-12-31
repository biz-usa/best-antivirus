

'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "./ui/button"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/store/cart"
import { CartItems } from "./cart-items"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"


export function CartButton() {
    const { cartCount, isCartOpen, setCartOpen, fetchUserProfile, clearUserProfile } = useCartStore();
    const { user } = useAuth();
    const [count, setCount] = useState(0);

    // Fetch user profile for loyalty discounts when cart is opened
    useEffect(() => {
        if (isCartOpen && user) {
            fetchUserProfile(user.uid);
        } else if (isCartOpen && !user) {
            clearUserProfile();
        }
    }, [isCartOpen, user, fetchUserProfile, clearUserProfile]);

    // This useEffect ensures that the cart count is only updated on the client-side
    // to prevent hydration mismatches, as the cart state is persisted in localStorage.
    useEffect(() => {
        setCount(cartCount());
    }, [cartCount]);

    // This is a subscription to the store, so it updates when the cart changes.
    useEffect(() => {
        const unsubscribe = useCartStore.subscribe(
            (state) => setCount(state.cartCount())
        );
        return () => unsubscribe();
    }, []);

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {count}
                        </span>
                    )}
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Giỏ hàng</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
                <SheetHeader className="px-4 text-left">
                    <SheetTitle>Giỏ hàng ({count})</SheetTitle>
                </SheetHeader>
                <CartItems />
                 {/* Hidden SheetClose to be able to close it programmatically */}
                <SheetClose data-radix-dialog-close />
            </SheetContent>
        </Sheet>
    )
}
