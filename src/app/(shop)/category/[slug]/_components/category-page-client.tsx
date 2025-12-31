
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFilters } from '@/components/product-filters';
import type { Category, Product, SiteConfig } from '@/lib/types';
import { useProductStore } from '@/store/product';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductList } from '@/components/product-list';


function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CategoryPageClient({
  initialProducts,
  allCategories,
  category,
  brands,
  licenseTypes,
  siteConfig
}: {
  initialProducts: Product[],
  allCategories: Category[],
  category: Category,
  brands: string[],
  licenseTypes: string[],
  siteConfig: SiteConfig
}) {
    const slug = category.slug;
    const setInitialProducts = useProductStore((state) => state.setInitialProducts);
    const toggleCategory = useProductStore((state) => state.toggleCategory);
    const selectedCategories = useProductStore((state) => state.selectedCategories);
    const [isFilterVisible, setIsFilterVisible] = React.useState(true);


    useEffect(() => {
        setInitialProducts(initialProducts);
        // Ensure the current category from URL is always selected
        if (!selectedCategories.includes(slug)) {
            toggleCategory(slug, true);
        }
    }, [initialProducts, setInitialProducts, slug, selectedCategories, toggleCategory]);
  
    return (
        <div className="relative">
          <div className={cn(
            "grid items-start gap-8 transition-all duration-300",
            "md:grid-cols-[288px_1fr]",
            !isFilterVisible && "md:grid-cols-[0_1fr]"
           )}>
            <aside className="hidden md:block sticky top-20 z-20 transition-all duration-300 overflow-hidden">
                <div className="h-[calc(100vh-6rem)] overflow-y-auto pr-4">
                    <ProductFilters 
                        categories={allCategories}
                        brands={brands}
                        licenseTypes={licenseTypes}
                        enabledFilters={siteConfig.shop.filters}
                    />
                </div>
            </aside>
            <main className="min-w-0">
                <div className="space-y-6">
                    <header className="flex items-start justify-between">
                        <div className="flex items-center">
                            <Button variant="outline" size="icon" className="hidden md:inline-flex mr-4" onClick={() => setIsFilterVisible(!isFilterVisible)}>
                                {isFilterVisible ? <PanelLeftClose /> : <PanelRightClose />}
                                <span className="sr-only">Toggle filters</span>
                            </Button>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-primary inline-block align-middle">{category.name}</h1>
                                <p className="mt-2 text-lg text-muted-foreground">
                                    Duyệt qua các sản phẩm trong danh mục {category.name.toLowerCase()}.
                                </p>
                            </div>
                        </div>
                    </header>
                    <div className="my-4 max-w-xl">
                        <SearchBar />
                    </div>
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Lọc sản phẩm
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <ScrollArea className="h-full pr-6">
                                    <ProductFilters 
                                        categories={allCategories}
                                        brands={brands}
                                        licenseTypes={licenseTypes}
                                        enabledFilters={siteConfig.shop.filters}
                                    />
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                    </div>
                    <Suspense fallback={<ProductListSkeleton />}>
                        <ProductList />
                    </Suspense>
                </div>
            </main>
        </div>
       </div>
    );
}

