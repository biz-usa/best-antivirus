
'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { getCustomers, updateUserStatus, deleteUsers, emptyCustomerTrash } from '@/lib/admin-actions';
import { getOrders } from '@/lib/data';
import type { Customer, Order, UserProfile } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { CustomersTable } from './customers-table';
import { CustomersTableToolbar } from './customers-table-toolbar';
import { Input } from "@/components/ui/input";
import { Search, ArrowDownUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { serializeForClient } from '@/lib/serializeForClient';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CustomersClientPageProps {
  initialCustomers: UserProfile[];
}

export function CustomersClientPage({ initialCustomers }: CustomersClientPageProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialCustomers);
  const [ordersMap, setOrdersMap] = useState<Record<string, Order[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isBulkActionPending, startBulkActionTransition] = useTransition();
  const [sortBy, setSortBy] = useState('name_asc');
  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(currentSearchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);
  
  const handleTabChange = (newTab: string) => {
      setActiveTab(newTab);
      const params = new URLSearchParams(currentSearchParams);
      params.set('tab', newTab);
      router.replace(`${pathname}?${params.toString()}`);
  }

  const fetchCustomerAndOrderData = useCallback(async () => {
    setIsLoading(true);
    setSelectedCustomerIds([]);
    
    const search = currentSearchParams.get('search') || undefined;
    const tab = currentSearchParams.get('tab') || 'active';
    setActiveTab(tab);
    
    const [fetchedProfiles, { orders }] = await Promise.all([
        getCustomers({ status: tab as 'active' | 'trashed' }),
        getOrders({})
    ]);
    
    let filteredProfiles = fetchedProfiles;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredProfiles = fetchedProfiles.filter(p => 
            p.displayName.toLowerCase().includes(searchLower) ||
            (p.email && p.email.toLowerCase().includes(searchLower))
        );
    }
    
    setProfiles(filteredProfiles);
    
    const newOrdersMap: Record<string, Order[]> = {};
    orders.forEach(order => {
        if (order.customer.id) {
            if (!newOrdersMap[order.customer.id]) {
                newOrdersMap[order.customer.id] = [];
            }
            newOrdersMap[order.customer.id].push(order);
        }
    });
    setOrdersMap(newOrdersMap);

    setIsLoading(false);
  }, [currentSearchParams]);
  
  useEffect(() => {
    fetchCustomerAndOrderData();
  }, [fetchCustomerAndOrderData]);

  const customersWithStats = useMemo<Customer[]>(() => {
    const customers = profiles.map(profile => {
        const customerOrders = ordersMap[profile.uid] || [];
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        return {
            ...profile,
            name: profile.displayName,
            totalOrders: customerOrders.length,
            totalSpent,
        };
    });

    customers.sort((a, b) => {
      switch (sortBy) {
        case 'spent_desc': return b.totalSpent - a.totalSpent;
        case 'spent_asc': return a.totalSpent - b.totalSpent;
        case 'orders_desc': return b.totalOrders - a.totalOrders;
        case 'orders_asc': return a.totalOrders - b.totalOrders;
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return customers;
  }, [profiles, ordersMap, sortBy]);

  const handleBulkAction = async (action: 'trash' | 'restore' | 'delete' | 'emptyTrash') => {
    startBulkActionTransition(async () => {
      try {
        let message = '';
        if (action === 'trash') {
            await updateUserStatus(selectedCustomerIds, 'trashed');
            message = `Đã chuyển ${selectedCustomerIds.length} khách hàng vào thùng rác.`;
        } else if (action === 'restore') {
            await updateUserStatus(selectedCustomerIds, 'active');
            message = `Đã khôi phục ${selectedCustomerIds.length} khách hàng.`;
        } else if (action === 'delete') {
            await deleteUsers(selectedCustomerIds);
            message = `Đã xóa vĩnh viễn ${selectedCustomerIds.length} khách hàng.`;
        } else if (action === 'emptyTrash') {
            await emptyCustomerTrash();
            message = 'Đã dọn sạch thùng rác.'
        }
        
        toast({ title: 'Thành công!', description: message });
        fetchCustomerAndOrderData();

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể thực hiện hành động.',
        });
      }
    });
  };

  const sortOptions = {
    name_asc: 'Tên khách hàng: A-Z',
    name_desc: 'Tên khách hàng: Z-A',
    spent_desc: 'Chi tiêu: Cao đến thấp',
    spent_asc: 'Chi tiêu: Thấp đến cao',
    orders_desc: 'Số đơn hàng: Nhiều đến ít',
    orders_asc: 'Số đơn hàng: Ít đến nhiều',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm theo tên hoặc email..."
                    className="pl-10"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={currentSearchParams.get('search')?.toString()}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">
                        <ArrowDownUp className="mr-2 h-4 w-4" />
                        <span>{sortOptions[sortBy as keyof typeof sortOptions]}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                        {Object.entries(sortOptions).map(([key, value]) => (
                            <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
         <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
              <TabsTrigger value="trashed">Thùng rác</TabsTrigger>
            </TabsList>
          </div>
            {selectedCustomerIds.length > 0 && (
                <div className="p-4 mb-4 bg-muted border-l-4 border-primary rounded-r-lg">
                    <CustomersTableToolbar 
                        selectedCount={selectedCustomerIds.length}
                        onTrash={() => handleBulkAction('trash')}
                        onRestore={() => handleBulkAction('restore')}
                        onDelete={() => handleBulkAction('delete')}
                        onEmptyTrash={() => handleBulkAction('emptyTrash')}
                        isPending={isBulkActionPending}
                        activeTab={activeTab as 'active' | 'trashed'}
                    />
                </div>
            )}
           <TabsContent value="active">
                <CustomersTable
                    customers={customersWithStats}
                    isLoading={isLoading}
                    selectedCustomerIds={selectedCustomerIds}
                    setSelectedCustomerIds={setSelectedCustomerIds}
                />
            </TabsContent>
            <TabsContent value="trashed">
                 <CustomersTable
                    customers={customersWithStats}
                    isLoading={isLoading}
                    selectedCustomerIds={selectedCustomerIds}
                    setSelectedCustomerIds={setSelectedCustomerIds}
                />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
