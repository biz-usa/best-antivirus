
'use client';

import { getProducts, getCategories, getBrands, getLicenseTypes, getSiteConfig } from '@/lib/data';
import { ProductList } from '@/components/product-list';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductFilters } from '@/components/product-filters';
import type { Category, Product, SiteConfig } from '@/lib/types';
import { useProductStore } from '@/store/product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { SearchBar } from '@/components/search-bar';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function PopularSearches({ terms }: { terms: string[] }) {
    const setSearchTerm = useProductStore((state) => state.setSearchTerm);
    
    const handleSearch = (term: string) => {
        setSearchTerm(term);
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Phổ biến:</span>
            {terms.map(term => (
                <Badge 
                    key={term}
                    variant="secondary"
                    onClick={() => handleSearch(term)}
                    className="cursor-pointer hover:bg-primary/10"
                >
                    {term}
                </Badge>
            ))}
        </div>
    )
}

function ProductsPageContent({
    initialProducts,
    categories,
    brands,
    licenseTypes,
    siteConfig
}: {
    initialProducts: Product[],
    categories: Category[],
    brands: string[],
    licenseTypes: string[],
    siteConfig: SiteConfig
}) {
    const setInitialProducts = useProductStore((state) => state.setInitialProducts);
    const [isFilterVisible, setIsFilterVisible] = useState(true);

    useEffect(() => {
        setInitialProducts(initialProducts);
    }, [initialProducts, setInitialProducts]);


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
                    categories={categories}
                    brands={brands}
                    licenseTypes={licenseTypes}
                    enabledFilters={siteConfig.shop.filters}
                />
            </div>
        </aside>
        <main className="min-w-0">
             <div className="space-y-6">
                <header className="flex items-start justify-between">
                  <div className='flex items-center'>
                     <Button variant="outline" size="icon" className="hidden md:inline-flex mr-4" onClick={() => setIsFilterVisible(!isFilterVisible)}>
                        {isFilterVisible ? <PanelLeftClose /> : <PanelRightClose />}
                        <span className="sr-only">Toggle filters</span>
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary">Cửa hàng</h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Khám phá bộ sưu tập phần mềm đa dạng của chúng tôi.
                        </p>
                    </div>
                  </div>
                </header>
                 <div className="my-4 space-y-3">
                    <div className="max-w-xl">
                        <SearchBar />
                    </div>
                    <PopularSearches terms={siteConfig.shop.popularSearches} />
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
                                    categories={categories}
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

export default function ProductsPageWrapper() {
    const [initialProducts, setInitialProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [licenseTypes, setLicenseTypes] = useState<string[]>([]);
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [products, cats, brds, lics, config] = await Promise.all([
                getProducts(),
                getCategories(),
                getBrands(),
                getLicenseTypes(),
                getSiteConfig(),
            ]);
            setInitialProducts(products);
            setCategories(cats);
            setBrands(brds);
            setLicenseTypes(lics);
            setSiteConfig(config);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading || !siteConfig) {
        return (
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="hidden md:block w-full md:w-64 lg:w-72 flex-shrink-0">
                    <Skeleton className="h-96 w-full" />
                </aside>
                <main className="flex-1">
                    <ProductListSkeleton />
                </main>
            </div>
        );
    }

    return (
        <ProductsPageContent
            initialProducts={initialProducts}
            categories={categories}
            brands={brands}
            licenseTypes={licenseTypes}
            siteConfig={siteConfig}
        />
    );
}
