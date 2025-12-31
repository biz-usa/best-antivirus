

'use client';

import { useWishlistStore } from '@/plugins/registry';
import { ProductCard } from '@/components/product-card';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
    const { user } = useAuth();
    const userId = user?.uid || 'guest';
    const { wishlists } = useWishlistStore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const wishlist = isClient ? (wishlists[userId] || []) : [];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">
                    Danh sách yêu thích
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Các sản phẩm bạn đã lưu để xem lại sau.
                </p>
            </header>
            
            {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                        <ProductCard key={product.id} product={product} showPrice={true} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h2 className="mt-6 text-2xl font-semibold">
                        Danh sách yêu thích của bạn đang trống
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Hãy bắt đầu khám phá và nhấn vào biểu tượng trái tim để lưu lại các sản phẩm bạn quan tâm.
                    </p>
                     <Button asChild className="mt-6">
                        <Link href="/products">Bắt đầu mua sắm</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
