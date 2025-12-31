

      

'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrders } from '@/lib/data';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, PackageSearch, CreditCard, LoaderCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ExportOrdersButton } from '@/app/cms/admin/orders/_components/export-orders-button';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { serializeForClient } from '@/lib/serializeForClient';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

const formatDate = (dateInput: any): string => {
    if (!dateInput) return 'N/A';
    const d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(d.getTime())) {
        try {
            // Fallback for ISO strings that might not be directly constructible
            const parsed = Date.parse(dateInput);
            if (!isNaN(parsed)) {
                return new Intl.DateTimeFormat('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).format(new Date(parsed));
            }
        } catch (e) {
             return 'Invalid Date';
        }
       return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
};


function OrderHistorySkeleton() {
    return (
        <div className="border rounded-lg">
             <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Mã đơn hàng</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead><span className="sr-only">Hành động</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                   {Array.from({ length: 5 }).map((_, i) => (
                     <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                   ))}
                </TableBody>
            </Table>
        </div>
    )
}

const PAGE_SIZE = 20;

function OrderHistoryContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = useCallback(async (isLoadMore = false) => {
    if (!user) return;

    if (!isLoadMore) {
      setIsFetching(true);
      setOrders([]);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    const { orders: fetchedOrders, lastVisible } = await getOrders({
      userId: user.uid,
      limit: PAGE_SIZE,
      startAfter: isLoadMore ? lastDoc : null,
      options: { status: statusFilter === 'all' ? undefined : statusFilter }
    });
    
    const serializedOrders = serializeForClient(fetchedOrders) as Order[];

    setOrders(prev => isLoadMore ? [...prev, ...serializedOrders] : serializedOrders);
    setLastDoc(lastVisible);
    setHasMore(fetchedOrders.length === PAGE_SIZE);
    
    setIsFetching(false);
    setIsLoadingMore(false);
  }, [user, statusFilter, lastDoc]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
       fetchOrders(false);
    }
  }, [user, loading, router, statusFilter]);

  const getStatusVariant = (status: string) => {
    switch(status.toLowerCase()) {
        case 'hoàn thành': return 'default';
        case 'đang xử lý': return 'secondary';
        case 'chờ thanh toán': return 'outline';
        case 'đã hủy': return 'destructive';
        default: return 'outline';
    }
  }

  const handleTabChange = (value: string) => {
    setStatusFilter(value);
  }

  if (loading || !user) {
    return <OrderHistorySkeleton />;
  }

  return (
    <div className="space-y-6">
       <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Lịch sử đơn hàng</h1>
            <p className="mt-1 text-muted-foreground">
              Xem lại các đơn hàng đã đặt của bạn.
            </p>
        </div>
        <ExportOrdersButton userId={user.uid} />
      </header>

       <Tabs value={statusFilter} onValueChange={handleTabChange}>
            <div className="overflow-x-auto pb-2">
                <TabsList className="flex-nowrap w-max">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="Chờ thanh toán">Chờ thanh toán</TabsTrigger>
                    <TabsTrigger value="Đang xử lý">Đang xử lý</TabsTrigger>
                    <TabsTrigger value="Hoàn thành">Hoàn thành</TabsTrigger>
                    <TabsTrigger value="Đã hủy">Đã hủy</TabsTrigger>
                </TabsList>
            </div>
       
           <div className="relative mt-4">
                {isFetching ? (
                    <OrderHistorySkeleton />
                ) : (
                    <div className={cn("border rounded-lg transition-opacity")}>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Mã đơn hàng</TableHead>
                                <TableHead>Ngày đặt</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Tổng tiền</TableHead>
                                <TableHead><span className="sr-only">Hành động</span></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {orders.length > 0 ? (
                            orders.map((order) => {
                                const isCompleted = order.status === 'Hoàn thành';
                                const isPendingPayment = order.status === 'Chờ thanh toán';
                                
                                const getTooltipMessage = () => {
                                    if (order.status === 'Chờ thanh toán') return "Đơn hàng đang chờ thanh toán.";
                                    if (order.status === 'Đang xử lý') return "Đơn hàng đang được xử lý, chưa thể tải về.";
                                    if (order.status === 'Đã hủy') return "Đơn hàng đã bị hủy.";
                                    return "";
                                }

                                return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium font-mono">
                                        <Link href={`/profile/order-history/${order.id}`} className="hover:underline text-primary">
                                            {order.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                                    <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                         {isPendingPayment ? (
                                            <Button asChild variant="default" size="sm">
                                                <Link href={`/order/payment/${order.id}`}>
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    Thanh toán
                                                </Link>
                                            </Button>
                                        ) : isCompleted ? (
                                            <Button asChild variant="default" size="sm">
                                                <Link href={`/profile/downloads?orderId=${order.id}`}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Tải về
                                                </Link>
                                            </Button>
                                        ) : (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {/* The span is necessary for the tooltip to work on a disabled button */}
                                                        <span tabIndex={0}>
                                                            <Button variant="outline" size="sm" disabled>
                                                                 {order.status === 'Đang xử lý' ? (
                                                                    <>
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Tải về
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                        Thanh toán
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{getTooltipMessage()}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        <Button asChild variant="ghost" size="sm">
                                                <Link href={`/profile/order-history/${order.id}`}>
                                                    Xem chi tiết
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                        </Button>
                                    </div>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <PackageSearch className="h-10 w-10" />
                                            <p className="font-medium">Không tìm thấy đơn hàng nào.</p>
                                             {!isFetching && <p className="text-sm">Hãy thử chọn một trạng thái khác.</p>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                )}
           </div>
       </Tabs>
        {hasMore && (
            <div className="flex justify-center mt-6">
                <Button onClick={() => fetchOrders(true)} disabled={isLoadingMore}>
                    {isLoadingMore && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Tải thêm
                </Button>
            </div>
        )}
    </div>
  );
}

export default function OrderHistoryPage() {
    return (
        <Suspense fallback={<OrderHistorySkeleton />}>
            <OrderHistoryContent />
        </Suspense>
    )
}

    
