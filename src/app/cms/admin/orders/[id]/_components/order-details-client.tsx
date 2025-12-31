

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
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Order, OrderItem, ProductVariant } from "@/lib/types";
import { OrderDigitalAssets } from "./order-digital-assets";
import { UpdateStatusButton } from "../../_components/update-status-button";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

const formatDateTime = (date: any) => {
    const d = new Date(date); // Directly use the string date
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh',
    }).format(d);
}

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'hoàn thành': return 'default';
        case 'đang xử lý': return 'secondary';
        case 'chờ thanh toán': return 'outline';
        case 'đã hủy': return 'destructive';
        default: return 'outline';
    }
};

type OrderItemWithDetails = OrderItem & { variant: ProductVariant | null };

interface OrderDetailsClientProps {
    order: Order;
    itemsWithDetails: OrderItemWithDetails[];
}

export function OrderDetailsClient({ order, itemsWithDetails }: OrderDetailsClientProps) {

  const subtotal = order.subtotal;
  const vat = order.vat;
  const total = order.total;
  const manualDiscount = order.discount?.value ?? 0;
  const loyaltyDiscount = (order.subtotal + order.vat) - manualDiscount - order.total;

  return (
    <div className="flex flex-col gap-6">
       <header className="flex items-start justify-between">
            <div>
                 <Button variant="outline" asChild className="mb-4">
                    <Link href="/cms/admin/orders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại Danh sách đơn hàng
                    </Link>
                </Button>
                <h1 className="text-2xl font-semibold">
                    Đơn hàng{' '}
                     <Link href={`/cms/admin/orders/${order.id}`} className="hover:underline font-mono">
                         {order.id}
                    </Link>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {formatDateTime(order.createdAt)}
                </p>
                 <div className="mt-2">
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-20">
                <UpdateStatusButton 
                    orderId={order.id}
                    currentStatus={order.status}
                    targetStatus="Đang xử lý"
                    label="Chuyển sang Đang xử lý"
                    as="button"
                />
                <UpdateStatusButton 
                    orderId={order.id}
                    currentStatus={order.status}
                    targetStatus="Hoàn thành"
                    label="Đánh dấu là Hoàn thành"
                    as="button"
                />
                 <UpdateStatusButton 
                    orderId={order.id}
                    currentStatus={order.status}
                    targetStatus="Đã hủy"
                    label="Hủy đơn hàng"
                    as="button"
                />
            </div>
       </header>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
            {/* Order Items */}
             <Card>
                <CardHeader>
                    <CardTitle>Sản phẩm trong đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead className="w-[180px]">Tài nguyên số</TableHead>
                                <TableHead className="text-right">Thành tiền</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itemsWithDetails.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium align-top">
                                        <div className="font-semibold">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">SKU: {item.variant?.sku}</div>
                                        <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <OrderDigitalAssets variant={item.variant} />
                                    </TableCell>
                                    <TableCell className="text-right align-top">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
             {/* Order Payment */}
            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết thanh toán</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Phương thức</span>
                        <span>{order.paymentMethod}</span>
                    </div>
                     <Separator className="my-4" />
                    <div className="w-full max-w-sm space-y-2 text-sm ml-auto">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tạm tính</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {order.discount && manualDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Giảm giá ({order.discount.code})</span>
                                <span>-{formatCurrency(manualDiscount)}</span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                             <div className="flex justify-between text-green-600">
                                <span>Giảm giá thành viên</span>
                                <span>-{formatCurrency(loyaltyDiscount)}</span>
                            </div>
                        )}
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Thuế GTGT</span>
                            <span>{formatCurrency(vat)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Phí vận chuyển</span>
                            <span>{formatCurrency(0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                            <span>Tổng cộng</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                 </CardContent>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-8">
            {/* Customer Details */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm pt-4">
                    <p><strong>Tên:</strong> <Link href={`/cms/admin/customers/${order.customer.id}`} className="text-primary hover:underline">{order.customer.name}</Link></p>
                    <p><strong>Email:</strong> <a href={`mailto:${order.customer.email}`} className="text-primary hover:underline">{order.customer.email}</a></p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
