
'use client';

import { Button } from '@/components/ui/button';
import { Product, ProductVariant } from '@/lib/types';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { StockNotifier } from '@/plugins/registry';

interface AddToCartButtonProps {
    product: Product;
    variant: ProductVariant;
    disabled?: boolean;
}

export function AddToCartButton({ product, variant, disabled = false }: AddToCartButtonProps) {
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        addItem(product, variant);
    }
    
    if (disabled) {
        return <StockNotifier product={product} variant={variant} />;
    }

    return (
        <Button 
            onClick={handleAddToCart} 
            size="lg" 
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Thêm vào giỏ hàng
        </Button>
    );
}
