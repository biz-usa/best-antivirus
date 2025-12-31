
'use client';

import { useCartStore } from '@/store/cart';
import { VAT_RATE } from '@/lib/constants';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import Image from 'next/image';
import { Minus, Plus, Trash, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import type { CartItem, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';


interface CartItemsProps {
    view?: 'cart' | 'summary';
    showCheckoutButton?: boolean;
    initialItems?: CartItem[];
}

export function CartItems({ view = 'cart', showCheckoutButton = true, initialItems }: CartItemsProps) {
  const { items: storeItems, removeItem, setItemQuantity, totalPrice, vat, totalWithVat, cartCount, discountAmount, loyaltyDiscountAmount, appliedDiscount, setCartOpen, fetchUserProfile, clearUserProfile, userProfile } = useCartStore();
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch user profile when user logs in
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid);
    } else {
      clearUserProfile();
    }
  }, [user, fetchUserProfile, clearUserProfile]);

  const items = initialItems || storeItems;

  const redirectToCheckout = () => {
      setCartOpen(false);
      router.push('/checkout');
  };
  
  const subtotal = totalPrice();
  const manualDiscount = discountAmount() - loyaltyDiscountAmount();
  const loyaltyDiscount = loyaltyDiscountAmount();
  const vatAmount = vat();
  const finalTotal = totalWithVat();
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

  
  const currentCartCount = items.reduce((acc, item) => acc + item.quantity, 0);


  if (currentCartCount === 0) {
    return (
       <Card>
           <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-lg text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
                <Button asChild className="mt-4">
                    <Link href="/products">Tiếp tục mua sắm</Link>
                </Button>
            </div>
           </CardContent>
       </Card>
    );
  }

  const CartContent = (
    <ScrollArea className={view === 'cart' ? 'h-[400px]' : ''}>
        <div className="space-y-4">
            {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pr-4">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                        <Image src={item.imageUrl!} alt={item.name} fill className="object-contain rounded-md border" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                            <div className="flex-1">
                                <p className="font-semibold text-sm truncate pr-2">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.selectedVariant.name}</p>
                                <p className="text-sm text-muted-foreground sm:hidden mt-1">{formatCurrency((item.selectedVariant.salePrice || item.selectedVariant.price) * item.quantity)}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="font-semibold text-sm">{formatCurrency((item.selectedVariant.salePrice || item.selectedVariant.price) * item.quantity)}</p>
                            </div>
                        </div>
                         {view === 'cart' && (
                             <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setItemQuantity(item.id!, item.quantity - 1)} disabled={item.quantity === 1}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="mx-2 w-4 text-center">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => setItemQuantity(item.id!, item.quantity + 1)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => removeItem(item.id!)}>
                                    <Trash className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </ScrollArea>
  );

  const SummaryContent = (
    <>
        <Separator className="my-4" />
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
            </div>
            {manualDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                    <span className="text-muted-foreground flex items-center gap-1"><Ticket className="h-4 w-4" /> {appliedDiscount?.code}</span>
                    <span>-{formatCurrency(manualDiscount)}</span>
                </div>
            )}
             {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                    <span className="text-muted-foreground">Giảm giá hạng {userProfile?.loyaltyTier}</span>
                    <span>-{formatCurrency(loyaltyDiscount)}</span>
                </div>
            )}
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Thuế GTGT ({VAT_RATE * 100}%)</span>
                <span>{formatCurrency(vatAmount)}</span>
            </div>
             <Separator />
            <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span>{formatCurrency(finalTotal)}</span>
            </div>
        </div>
    </>
  );

  if (view === 'summary') {
      return (
         <Card>
            <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
                {CartContent}
                {SummaryContent}
            </CardContent>
        </Card>
      )
  }

  return (
    <>
        {CartContent}
        {SummaryContent}
        {showCheckoutButton && (
            <div className="mt-6">
                <Button onClick={redirectToCheckout} className="w-full" size="lg">
                    Tiến hành thanh toán
                </Button>
            </div>
        )}
    </>
  );
}
