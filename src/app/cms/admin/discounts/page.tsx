

import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from "next/link";
import { getDiscounts } from "./actions";
import { Badge } from "@/components/ui/badge";
import { DeleteDiscountButton } from "./_components/delete-discount-button";
import { serializeForClient } from "@/lib/serializeForClient";
import type { Discount } from "@/lib/types";


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

const formatDate = (date: any) => {
  if (!date) return 'Không có';
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};


export default async function AdminDiscountsPage() {
  const rawDiscounts = await getDiscounts();
  const discounts = serializeForClient(rawDiscounts) as Discount[];

  return (
    <div className="flex flex-col gap-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Mã giảm giá</h1>
                <p className="text-muted-foreground mt-1">
                    Tạo và quản lý các mã giảm giá cho cửa hàng của bạn.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild>
                    <Link href="/cms/admin/discounts/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tạo mã giảm giá
                    </Link>
                </Button>
            </div>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Danh sách mã giảm giá</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Ngày hết hạn</TableHead>
                    <TableHead>Sử dụng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {discounts.map((discount) => (
                    <TableRow key={discount.id}>
                        <TableCell className="font-mono font-medium">{discount.code}</TableCell>
                        <TableCell>{discount.type === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</TableCell>
                        <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}</TableCell>
                        <TableCell>{formatDate(discount.expiresAt)}</TableCell>
                        <TableCell>{discount.timesUsed} / {discount.usageLimit || '∞'}</TableCell>
                         <TableCell>
                            <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                                {discount.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                            </Badge>
                        </TableCell>
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
                                <Link href={`/cms/admin/discounts/${discount.id}/edit`}>Sửa</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DeleteDiscountButton discountId={discount.id!} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                    {discounts.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            Chưa có mã giảm giá nào.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </div>
  );
}
