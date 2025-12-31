

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, LoaderCircle, PackageSearch } from "lucide-react";
import { getOrders } from "@/lib/data";
import Link from "next/link";
import { OrderTableControls } from "./_components/order-table-controls";
import { Suspense, useEffect, useState, useCallback, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateStatusButton } from "./_components/update-status-button";
import { ExportOrdersButton } from "./_components/export-orders-button";
import type { Order } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { serializeForClient } from "@/lib/serializeForClient";
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Checkbox } from "@/components/ui/checkbox";
import { OrderTableToolbar } from "./_components/order-table-toolbar";
import { updateBulkOrderStatus, deleteBulkOrders } from "./actions";
import { useToast } from "@/hooks/use-toast";


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    // Handles Firestore Timestamps, ISO strings, and Date objects
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) {
        try {
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
    }).format(date);
}

const getStatusVariant = (status: string) => {
    switch(status.toLowerCase()) {
        case 'hoàn thành': return 'default';
        case 'đang xử lý': return 'secondary';
        case 'chờ thanh toán': return 'outline';
        case 'đã hủy': return 'destructive';
        default: return 'outline';
    }
};

function OrderTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"><Skeleton className="h-5 w-5" /></TableHead>
                    <TableHead>Mã đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày đặt</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function OrdersTable({ 
    orders, 
    selectedOrderIds, 
    setSelectedOrderIds 
}: { 
    orders: Order[],
    selectedOrderIds: string[],
    setSelectedOrderIds: (ids: string[]) => void
}) {

    const isAllSelected = orders.length > 0 && selectedOrderIds.length === orders.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrderIds(orders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };
    
    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedOrderIds([...selectedOrderIds, id]);
        } else {
            setSelectedOrderIds(selectedOrderIds.filter(orderId => orderId !== id));
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>Mã đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày đặt</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id} data-state={selectedOrderIds.includes(order.id) ? "selected" : ""}>
                        <TableCell>
                            <Checkbox
                                checked={selectedOrderIds.includes(order.id)}
                                onCheckedChange={(checked) => handleSelectOne(order.id, !!checked)}
                                aria-label={`Select order ${order.id}`}
                            />
                        </TableCell>
                        <TableCell className="font-medium">
                           <Link href={`/cms/admin/orders/${order.id}`} className="hover:underline font-mono">
                             {order.id}
                           </Link>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{order.customer.name}</div>
                            <div className="text-sm text-muted-foreground hidden md:block">{order.customer.email}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                       <Link href={`/cms/admin/orders/${order.id}`}>Xem chi tiết</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <UpdateStatusButton 
                                        orderId={order.id}
                                        currentStatus={order.status}
                                        targetStatus="Hoàn thành"
                                        label="Đánh dấu là Hoàn thành"
                                        as="menuitem"
                                    />
                                    <UpdateStatusButton 
                                        orderId={order.id}
                                        currentStatus={order.status}
                                        targetStatus="Đang xử lý"
                                        label="Đánh dấu là Đang xử lý"
                                        as="menuitem"
                                    />
                                     <UpdateStatusButton 
                                        orderId={order.id}
                                        currentStatus={order.status}
                                        targetStatus="Đã hủy"
                                        label="Hủy đơn hàng"
                                        as="menuitem"
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                 {orders.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <PackageSearch className="h-10 w-10" />
                                <p className="font-medium">Không tìm thấy đơn hàng nào.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

const PAGE_SIZE = 20;

function OrdersPageContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isBulkActionPending, startBulkActionTransition] = useTransition();

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    
    const fetchOrders = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) {
            setIsLoading(true);
            setOrders([]);
            setLastDoc(null);
            setHasMore(true);
            setSelectedOrderIds([]);
        } else {
            setIsLoadingMore(true);
        }

        const { orders: fetchedOrders, lastVisible } = await getOrders({
            limit: PAGE_SIZE,
            startAfter: isLoadMore ? lastDoc : null,
            options: { search, status, sortBy, sortOrder }
        });
        
        const serializedOrders = serializeForClient(fetchedOrders) as Order[];

        setOrders(prev => isLoadMore ? [...prev, ...serializedOrders] : serializedOrders);
        setLastDoc(lastVisible);
        setHasMore(fetchedOrders.length === PAGE_SIZE);
        
        setIsLoading(false);
        setIsLoadingMore(false);
    }, [search, status, sortBy, sortOrder, lastDoc]);

    useEffect(() => {
        fetchOrders(false);
    }, [search, status, sortBy, sortOrder]);

    const handleBulkAction = async (action: 'cancel' | 'restore' | 'delete') => {
        startBulkActionTransition(async () => {
            try {
                let message = '';
                if (action === 'cancel') {
                    await updateBulkOrderStatus(selectedOrderIds, 'Đã hủy');
                    message = `Đã hủy ${selectedOrderIds.length} đơn hàng.`;
                } else if (action === 'restore') {
                    await updateBulkOrderStatus(selectedOrderIds, 'Chờ thanh toán');
                    message = `Đã khôi phục ${selectedOrderIds.length} đơn hàng.`;
                } else if (action === 'delete') {
                    await deleteBulkOrders(selectedOrderIds);
                    message = `Đã xóa vĩnh viễn ${selectedOrderIds.length} đơn hàng.`;
                }
                
                toast({ title: "Thành công!", description: message });
                fetchOrders(); // Refetch data
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Lỗi!', description: error.message || "Không thể thực hiện hành động hàng loạt." });
            }
        });
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Đơn hàng</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý tất cả đơn hàng của bạn.
                    </p>
                </div>
                 <ExportOrdersButton />
            </div>
             <Card>
                 <CardHeader>
                    <OrderTableControls />
                </CardHeader>
                <CardContent className="p-0">
                    {selectedOrderIds.length > 0 && (
                         <div className="p-4 border-t border-b bg-muted/50">
                            <OrderTableToolbar
                                selectedCount={selectedOrderIds.length}
                                onCancel={() => handleBulkAction('cancel')}
                                onRestore={() => handleBulkAction('restore')}
                                onDelete={() => handleBulkAction('delete')}
                                isPending={isBulkActionPending}
                                activeStatus={status}
                            />
                         </div>
                    )}
                    {isLoading ? <OrderTableSkeleton /> : <OrdersTable orders={orders} selectedOrderIds={selectedOrderIds} setSelectedOrderIds={setSelectedOrderIds} />}
                </CardContent>
            </Card>
             {hasMore && (
                <div className="flex justify-center">
                    <Button onClick={() => fetchOrders(true)} disabled={isLoadingMore}>
                        {isLoadingMore && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Tải thêm
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <OrdersPageContent />
        </Suspense>
    );
}
