
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { BrandLogo } from '@/components/brand-logo';
import { ProductReviewSummary } from '@/components/product-review-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Ban, CheckCircle } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { ProductComparison } from '@/components/product-comparison';
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import { SaleCountdown } from '@/components/sale-countdown';
import { useTrackRecentView, RecentViews } from '@/plugins/registry';
import type { Product, ProductVariant } from '@/lib/types';
import { useCurrencyStore } from '@/store/currency';
import { useAuth } from '@/context/auth-context';


// Helper to get the first available variant
const getDefaultVariant = (product: Product): ProductVariant | null => {
    if (product.variants && product.variants.length > 0) {
        // Find the first variant that is in stock
        const inStockVariant = product.variants.find(v => v.licenseKeys?.available && v.licenseKeys.available.length > 0);
        if (inStockVariant) return inStockVariant;
        // If all are out of stock, return the first one anyway to display info
        return product.variants[0];
    }
    return null;
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [thumbCarouselApi, setThumbCarouselApi] = useState<CarouselApi>();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(getDefaultVariant(product));
  const { formatPrice } = useCurrencyStore();
  const { userProfile } = useAuth();

  const { addProduct } = useTrackRecentView();

  useEffect(() => {
    addProduct(product);
  }, [product, addProduct]);

  const onThumbClick = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index);
    },
    [carouselApi]
  );

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    carouselApi.on('select', () => {
      const selectedSnap = carouselApi.selectedScrollSnap();
      thumbCarouselApi?.scrollTo(selectedSnap);
    });
  }, [carouselApi, thumbCarouselApi]);
  
   useEffect(() => {
    // When product data changes (e.g., loaded from parent), reset the selected variant
    setSelectedVariant(getDefaultVariant(product));
  }, [product]);

  if (!product || !selectedVariant) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Sản phẩm không có sẵn</h1>
        <p className="text-muted-foreground">Sản phẩm này hiện không có biến thể nào để bán.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  const now = new Date();
  const isSaleActive =
    selectedVariant?.salePrice &&
    selectedVariant.salePrice < selectedVariant.price &&
    (!selectedVariant.saleStartDate || new Date(selectedVariant.saleStartDate as unknown as string) <= now) &&
    (!selectedVariant.saleEndDate || new Date(selectedVariant.saleEndDate as unknown as string) >= now);

  const isSelectedVariantInStock =
    selectedVariant.licenseKeys?.available && selectedVariant.licenseKeys.available.length > 0;
    
  let finalPrice = selectedVariant.price;
  let showOriginalPrice = false;

  if (userProfile?.role === 'reseller' && selectedVariant.resellerPrice) {
      finalPrice = selectedVariant.resellerPrice;
      showOriginalPrice = false; // Resellers don't see original/sale prices, only their price.
  } else if (isSaleActive) {
      finalPrice = selectedVariant.salePrice!;
      showOriginalPrice = true;
  }

  const allImages = [product.imageUrl, ...(product.screenshots || [])];

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại cửa hàng
        </Button>
      </div>
      {/* Top section: Image and main info */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="space-y-2">
          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {allImages.map((img, index) => {
                const isMainImage = index === 0;
                return (
                  <CarouselItem key={`${img}-${index}`} className="aspect-square">
                    <Image
                      src={img}
                      alt={`${product.name} ${isMainImage ? 'main image' : `screenshot ${index}`}`}
                      width={1200}
                      height={1200}
                      className={cn(
                          "w-full h-full object-cover rounded-lg border",
                      )}
                      data-ai-hint={isMainImage ? product.imageHint : 'software screenshot'}
                      priority={isMainImage}
                    />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
          <Carousel
            setApi={setThumbCarouselApi}
            opts={{
              align: 'start',
              slidesToScroll: 1,
              containScroll: 'trimSnaps',
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {allImages.map((img, index) => (
                <CarouselItem
                  key={`${img}-${index}-thumb`}
                  onMouseDown={() => onThumbClick(index)}
                  className="pl-2 basis-1/4 sm:basis-1/5 cursor-pointer"
                >
                  <div
                    className={cn(
                      'overflow-hidden rounded-md border-2 aspect-square',
                      carouselApi?.selectedScrollSnap() === index ? 'border-primary' : 'border-transparent'
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        <div className="relative space-y-6">
          <div className="absolute top-0 right-0">
            <BrandLogo brand={product.brand} className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <Link href={`/category/${product.category.slug}`}>
              <Badge variant="secondary" className="text-sm">
                {product.category.name}
              </Badge>
            </Link>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-primary pr-16">{product.name}</h1>

          <p className="text-lg text-muted-foreground">{product.shortDescription}</p>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Chọn phiên bản:</h3>
              <RadioGroup
                value={selectedVariant.id}
                onValueChange={(variantId) => {
                  const newVariant = product.variants.find((v) => v.id === variantId);
                  if (newVariant) setSelectedVariant(newVariant);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {product.variants.map((variant) => {
                  const isOutOfStock =
                    !variant.licenseKeys?.available || variant.licenseKeys.available.length === 0;
                  
                  let variantFinalPrice = variant.price;
                   const variantIsSaleActive = variant.salePrice && variant.salePrice < variant.price && (!variant.saleStartDate || new Date(variant.saleStartDate as unknown as string) <= now) && (!variant.saleEndDate || new Date(variant.saleEndDate as unknown as string) >= now);

                  if (userProfile?.role === 'reseller' && variant.resellerPrice) {
                      variantFinalPrice = variant.resellerPrice;
                  } else if (variantIsSaleActive) {
                       variantFinalPrice = variant.salePrice!;
                  }

                  return (
                    <div key={variant.id}>
                      <RadioGroupItem value={variant.id} id={variant.id} className="peer sr-only" disabled={isOutOfStock} />
                      <Label
                        htmlFor={variant.id}
                        className={cn(
                          'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4',
                          'hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary',
                          isOutOfStock ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        )}
                      >
                        <span className="font-semibold">{variant.name}</span>
                        <span className="text-sm">{formatPrice(variantFinalPrice)}</span>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="mt-1">
                            Hết hàng
                          </Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          <Separator />

          {showOriginalPrice && selectedVariant.saleEndDate && <SaleCountdown saleEndDate={selectedVariant.saleEndDate as unknown as string} />}

          <div className="flex items-baseline gap-4">
            <p className={cn('text-3xl font-bold', showOriginalPrice ? 'text-destructive' : 'text-primary')}>
              {formatPrice(finalPrice)}
            </p>
            {showOriginalPrice && (
              <p className="text-xl font-medium text-muted-foreground line-through">
                {formatPrice(selectedVariant.price)}
              </p>
            )}
          </div>
          
           {isSelectedVariantInStock ? (
            <div className="flex items-center text-sm font-medium text-green-600 gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Còn hàng</span>
            </div>
          ) : (
            <div className="flex items-center text-sm font-medium text-destructive gap-2">
                <Ban className="h-4 w-4" />
                <span>Hết hàng</span>
            </div>
          )}

          <AddToCartButton product={product} variant={selectedVariant} disabled={!isSelectedVariantInStock} />
          {!isSelectedVariantInStock && (
            <div className="text-sm text-muted-foreground">
              <span>Biến thể sản phẩm này tạm hết hàng, vui lòng chọn loại khác hoặc đăng ký nhận thông báo khi có hàng.</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
            <Info className="h-5 w-5" />
            <span>Đây là sản phẩm kỹ thuật số. License key sẽ được gửi qua email.</span>
          </div>

          <div className="text-sm text-muted-foreground space-y-1 pt-4">
            <p>
              <strong>SKU:</strong> {selectedVariant.sku}
            </p>
            <p>
              <strong>MFR:</strong> {product.mfr}
            </p>
            <p>
              <strong>Thương hiệu:</strong> {product.brand}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom section: Details and Reviews */}
      <div className="space-y-8">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá & Nhận xét</TabsTrigger>
            <TabsTrigger value="comparison">So sánh</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm md:prose-base max-w-none text-foreground/80">
              <p>{product.longDescription}</p>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ProductReviewSummary reviews={product.reviews} />
          </TabsContent>
          <TabsContent value="comparison" className="mt-6">
            <ProductComparison product={product} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8 pt-8 border-t">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Sản phẩm cùng danh mục</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} showPrice={true} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Plugin */}
      <RecentViews currentProductId={product.id} />
    </div>
  );
}
