

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Order, OrderItem, Product, ProductVariant, SiteConfig } from "@/lib/types";
import { OrderItemActions } from "./order-item-actions";
import Image from "next/image";
import { VAT_RATE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Printer } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface OrderDetailsClientProps {
  order: Order;
  itemsWithDetails: (OrderItem & { variant: ProductVariant | null; product: Product | null })[];
  siteConfig: SiteConfig;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

const formatDateTime = (dateInput: any) => {
  const d = new Date(dateInput); // Handles both Date objects and string representations
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "hoàn thành":
      return "default";
    case "đang xử lý":
      return "secondary";
    case "chờ thanh toán":
      return "outline";
    case "đã hủy":
      return "destructive";
    default:
      return "outline";
  }
};

export function OrderDetailsClient({ order, itemsWithDetails, siteConfig }: OrderDetailsClientProps) {
  const { userProfile } = useAuth();
  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.subtotal ?? order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vat = order.vat ?? subtotal * VAT_RATE;
  const total = order.total ?? subtotal + vat;
  const manualDiscount = order.discount?.value ?? 0;
  const loyaltyDiscount = (order.subtotal + (order.vat || 0)) - manualDiscount - order.total;


  const logoUrl = siteConfig.companyInfo?.logoUrl;
  const companyInfo = siteConfig.companyInfo;

  const backLink = userProfile?.role === 'reseller' ? '/reseller/order-history' : '/profile/order-history';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 no-print">
        <Button asChild variant="outline">
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Lịch sử đơn hàng
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {order.status === 'Chờ thanh toán' && (
            <Button asChild>
              <Link href={`/order/payment/${order.id}`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Thanh toán ngay
              </Link>
            </Button>
          )}
           <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            In hóa đơn
          </Button>
        </div>
      </div>
      <Card className="invoice-content print-area">
        <CardHeader className="bg-secondary/30 p-6 print:bg-secondary/30">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Row 1: Logo and Invoice Title */}
                <div className="col-span-1">
                    {logoUrl && (
                        <div className="h-12 w-auto mb-4">
                            <Image
                                src={logoUrl}
                                alt={`${companyInfo.name} Logo`}
                                width={200}
                                height={48}
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    )}
                </div>
                <div className="col-span-1 text-right">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">HÓA ĐƠN</h1>
                    <p className="text-muted-foreground">#{order.id}</p>
                </div>

                {/* Row 2: Company Info and Order Info */}
                <div className="col-span-1 grid gap-1 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">{companyInfo.name}</p>
                    <p>{companyInfo.address}</p>
                    {companyInfo.taxCode && <p>MST: {companyInfo.taxCode}</p>}
                </div>
                <div className="col-span-1 grid gap-1 text-sm text-muted-foreground text-right">
                    <p><span className="font-semibold text-foreground">Ngày đặt hàng:</span> {formatDateTime(order.createdAt)}</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold text-foreground">Trạng thái:</span>
                        <Badge variant={getStatusVariant(order.status)} className="text-xs">{order.status}</Badge>
                    </div>
                </div>

                 {/* Row 3: Customer Info */}
                <div className="col-span-2 grid gap-1 text-sm pt-4">
                    <p className="font-semibold text-muted-foreground">KHÁCH HÀNG</p>
                    <p className="font-medium text-foreground">{order.customer.name}</p>
                    <p>{order.customer.email}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden md:table-cell no-print">Hình ảnh</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tổng cộng</TableHead>
                 <TableHead className="text-right no-print">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsWithDetails.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden md:table-cell no-print">
                     <Image
                        alt={item.product?.name || 'Product image'}
                        className="aspect-square rounded-md object-contain"
                        height="64"
                        src={item.product?.imageUrl || '/placeholder.svg'}
                        width="64"
                      />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      x {item.quantity}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </TableCell>
                   <TableCell className="text-right no-print">
                      <OrderItemActions 
                        product={item.product}
                        licenseKeys={item.variant?.licenseKeys?.used || []}
                      />
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-6" />
          <div className="w-full max-w-sm space-y-2 text-sm ml-auto">
            <div className="flex justify-between">
              <span>Tạm tính</span>
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
              <span>Thuế GTGT (VAT @ {VAT_RATE * 100}%)</span>
              <span>{formatCurrency(vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Tổng cộng</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
         <CardFooter className="mt-8 text-center text-xs text-muted-foreground p-6 border-t">
            <p>Cảm ơn quý khách đã tin tưởng và mua sắm tại Saigonsoft.com!</p>
        </CardFooter>
      </Card>
    </div>
  );
}
