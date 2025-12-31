
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Search, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function OrderTableControls() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'all') {
        params.delete('status');
    } else {
        params.set('status', status);
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSortBy = params.get('sortBy');
    const currentSortOrder = params.get('sortOrder');

    if (currentSortBy === field && currentSortOrder === 'desc') {
        params.set('sortOrder', 'asc');
    } else {
        params.set('sortBy', field);
        params.set('sortOrder', 'desc');
    }
    replace(`${pathname}?${params.toString()}`);
  }
  
  const getSortIcon = (field: string) => {
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    if (sortBy === field) {
        return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Tìm theo mã đơn hàng hoặc email khách hàng..."
                className="pl-10"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('search')?.toString()}
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => handleSort('createdAt')} className="flex gap-2">
                    Ngày đặt
                    {getSortIcon('createdAt')}
                </Button>
                <Button variant="ghost" onClick={() => handleSort('total')} className="flex gap-2">
                    Tổng tiền
                    {getSortIcon('total')}
                </Button>
            </div>
        </div>
        <Tabs defaultValue={searchParams.get('status') || 'all'} onValueChange={handleStatusChange}>
            <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="Chờ thanh toán">Chờ thanh toán</TabsTrigger>
                <TabsTrigger value="Đang xử lý">Đang xử lý</TabsTrigger>
                <TabsTrigger value="Hoàn thành">Hoàn thành</TabsTrigger>
                <TabsTrigger value="Đã hủy">Đã hủy</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
  );
}
