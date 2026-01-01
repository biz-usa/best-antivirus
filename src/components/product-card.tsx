

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { ArrowRight, Download, CheckCircle, XCircle } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { SaleCountdown } from './sale-countdown';
import { WishlistButton } from '@/plugins/registry';
import { useCurrencyStore } from '@/store/currency';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

interface ProductCardProps {
  product: Product;
  showPrice?: boolean;
}

export function ProductCard({ product, showPrice = true }: ProductCardProps) {
  const { formatPrice } = useCurrencyStore();
  const { userProfile } = useAuth();

  // Find the 'Default' variant, or fall back to the first variant.
  const displayVariant = product.variants?.find(v => v.name.toLowerCase() === 'mặc định') || product.variants?.[0];
  const now = new Date();
  
  // Helper to safely parse date/timestamp
  const parseDate = (d: any) => d?.toDate ? d.toDate() : (d ? new Date(d) : undefined);

  const saleStartDate = parseDate(displayVariant?.saleStartDate);
  const saleEndDate = parseDate(displayVariant?.saleEndDate);

  const isSaleActive = 
    displayVariant?.salePrice && 
    displayVariant.salePrice < displayVariant.price &&
    (!saleStartDate || saleStartDate <= now) &&
    (!saleEndDate || saleEndDate >= now);
    
  const isInStock = product.variants?.some(v => v.licenseKeys && v.licenseKeys.available && v.licenseKeys.available.length > 0);
  
  // Determine the price to display
  let finalPrice = displayVariant?.price || 0;
  let showOriginalPrice = false;

  if (userProfile?.role === 'reseller' && displayVariant?.resellerPrice) {
      finalPrice = displayVariant.resellerPrice;
      showOriginalPrice = false; // Resellers don't see original/sale prices, only their price.
  } else if (isSaleActive) {
      finalPrice = displayVariant!.salePrice!;
      showOriginalPrice = true;
  }

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-lg border">
      <Link href={`/products/${product.slug}`} className="block group flex flex-col h-full bg-card">
        <CardHeader className="p-0 relative">
          <div className="absolute top-2 right-2 z-10">
            <WishlistButton product={product} />
          </div>
          <div className="aspect-square overflow-hidden relative">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={1200}
              height={1200}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={product.imageHint}
            />
             <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-md">
                 <BrandLogo brand={product.brand} className="h-6 w-6 text-foreground" />
             </div>
             {showOriginalPrice && saleEndDate && (
                <div className="absolute top-0 left-0 w-full p-2">
                    <SaleCountdown saleEndDate={saleEndDate} />
                </div>
             )}
              <div className="absolute bottom-4 left-4">
                 <Badge variant={isInStock ? 'default' : 'secondary'} className={cn(isInStock ? 'bg-green-600/90 text-white' : 'bg-muted-foreground/80 text-white')}>
                     {isInStock ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                     {isInStock ? 'Còn hàng' : 'Hết hàng'}
                 </Badge>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors leading-tight">
              {product.name}
            </CardTitle>
             <CardDescription className="text-sm line-clamp-2 mt-2 text-muted-foreground">{product.shortDescription}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto flex items-end justify-between">
           {showPrice && displayVariant ? (
            <div>
               {showOriginalPrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(displayVariant.price)}
                </p>
              )}
              <p className="text-lg font-bold text-primary">
                {formatPrice(finalPrice)}
              </p>
            </div>
          ) : (
             <div className="text-lg font-bold text-muted-foreground">N/A</div>
          )}
           <Button variant="ghost" className="text-primary p-0 h-auto hover:bg-transparent">
              Xem chi tiết
              <ArrowRight className="inline-block ml-2 h-4 w-4" />
            </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
