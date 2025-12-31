

'use client';

import { getProducts, getBrands } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import ProductsTable from './_components/products-table';
import { serializeForClient } from '@/lib/serializeForClient';
import { useEffect, useState, Suspense, useCallback, useTransition } from 'react';
import type { Product, Brand } from '@/lib/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductsTableToolbar } from './_components/products-table-toolbar';
import { updateProductStatus, deleteProducts } from './actions';
import { useToast } from '@/hooks/use-toast';

function ProductsTableSkeleton() {
    return (
        <div className="p-6">
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProductFilters({ brands }: { brands: Brand[] }) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();

    const handleSearchChange = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        params.set('page', '1'); // Reset to first page
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleBrandChange = (brand: string) => {
        const params = new URLSearchParams(searchParams);
        if (brand && brand !== 'all') {
            params.set('brand', brand);
        } else {
            params.delete('brand');
        }
        params.set('page', '1');
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm theo tên sản phẩm..."
                    className="w-full pl-10"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    defaultValue={searchParams.get('search')?.toString()}
                />
            </div>
             <div className="w-full md:w-auto md:min-w-[200px] flex-shrink-0">
                <Select
                    onValueChange={handleBrandChange}
                    defaultValue={searchParams.get('brand') || 'all'}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Lọc theo thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                        {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}


function ProductsPageContent({ brands }: { brands: Brand[] }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isBulkActionPending, startBulkActionTransition] = useTransition();
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'hidden'>('active');

    const search = searchParams.get('search') || undefined;
    const brand = searchParams.get('brand') || undefined;
    
    const fetchData = useCallback(async (status: 'active' | 'hidden') => {
        setIsLoading(true);
        setSelectedProductIds([]);
        const productData = await getProducts(undefined, { search, brand, status });
        setProducts(serializeForClient(productData));
        setIsLoading(false);
    }, [search, brand]);

    useEffect(() => {
        fetchData(activeTab);
    }, [fetchData, activeTab]);

    const handleBulkAction = (action: 'hide' | 'restore' | 'delete') => {
        startBulkActionTransition(async () => {
            try {
                let message = '';
                if (action === 'hide') {
                    await updateProductStatus(selectedProductIds, 'hidden');
                    message = `Đã ẩn ${selectedProductIds.length} sản phẩm.`;
                } else if (action === 'restore') {
                    await updateProductStatus(selectedProductIds, 'active');
                    message = `Đã khôi phục ${selectedProductIds.length} sản phẩm.`;
                } else if (action === 'delete') {
                    await deleteProducts(selectedProductIds);
                    message = `Đã xóa vĩnh viễn ${selectedProductIds.length} sản phẩm.`;
                }
                toast({ title: 'Thành công!', description: message });
                fetchData(activeTab);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Lỗi!', description: error.message || "Không thể thực hiện hành động hàng loạt." });
            }
        });
    }

    const handleTabChange = (value: 'active' | 'hidden') => {
        setActiveTab(value);
        // We don't need to manually call fetchData here because the useEffect already watches activeTab
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Sản phẩm</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý danh sách sản phẩm của bạn.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/cms/admin/products/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Thêm sản phẩm
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <ProductFilters brands={brands} />
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'active' | 'hidden')}>
                        <div className="px-6 border-b">
                            <TabsList>
                                <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
                                <TabsTrigger value="hidden">Đã ẩn</TabsTrigger>
                            </TabsList>
                        </div>
                        {selectedProductIds.length > 0 && (
                            <div className="p-4 border-b">
                                <ProductsTableToolbar
                                    selectedCount={selectedProductIds.length}
                                    onHide={() => handleBulkAction('hide')}
                                    onRestore={() => handleBulkAction('restore')}
                                    onDelete={() => handleBulkAction('delete')}
                                    isPending={isBulkActionPending}
                                    activeTab={activeTab}
                                />
                            </div>
                        )}
                        <TabsContent value="active">
                             {isLoading ? <ProductsTableSkeleton /> : 
                                <ProductsTable 
                                    data={products} 
                                    onActionComplete={() => fetchData('active')}
                                    selectedProductIds={selectedProductIds}
                                    setSelectedProductIds={setSelectedProductIds} 
                                />
                             }
                        </TabsContent>
                        <TabsContent value="hidden">
                             {isLoading ? <ProductsTableSkeleton /> : 
                                <ProductsTable 
                                    data={products} 
                                    onActionComplete={() => fetchData('hidden')} 
                                    selectedProductIds={selectedProductIds}
                                    setSelectedProductIds={setSelectedProductIds}
                                />
                             }
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdminProductsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);

    useEffect(() => {
        getBrands(true).then(setBrands);
    }, []);

    return (
        <Suspense fallback={<div>Đang tải bộ lọc...</div>}>
            <ProductsPageContent brands={brands} />
        </Suspense>
    );
}
