
'use server';

import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/data";
import { getAdminCustomerDetails } from "@/lib/admin-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import Link from "next/link";
import { ArrowLeft, Star, Gem, Trophy, Diamond, UserX, StarIcon, ShoppingCart, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LoyaltyTier } from "@/lib/types";
import React from 'react';
import { CustomerRoleForm } from "./_components/customer-role-form";
import { serializeForClient } from "@/lib/serializeForClient";
import { CustomerLoyaltyForm } from "./_components/customer-loyalty-form";
import { CustomerInfoForm } from "./_components/customer-info-form";


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    const d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
};

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'hoàn thành': return 'default';
        case 'đang xử lý': return 'secondary';
        case 'chờ thanh toán': return 'outline';
        case 'đã hủy': return 'destructive';
        default: return 'outline';
    }
};

const tierIcons: Record<LoyaltyTier, React.ElementType> = {
    'Đồng': Star,
    'Bạc': Gem,
    'Vàng': Trophy,
    'Kim Cương': Diamond,
    'Chưa xếp hạng': UserX,
};

type Props = {
    params: Promise<{ id: string }>
}

export default async function CustomerDetailsPage({ params }: Props) {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    
    // Use getAdminCustomerDetails for server-side fetching with admin privileges
    const [data, siteConfig] = await Promise.all([
        getAdminCustomerDetails(decodedId),
        getSiteConfig()
    ]);

    if (!data || !data.profile) {
        notFound();
    }
    
    // Serialize data on the server before passing to client components
    const profile = serializeForClient(data.profile);
    const orders = serializeForClient(data.orders);
    
    const totalSpent = orders.reduce((acc: number, order: any) => acc + order.total, 0);
    
    // Safely get the loyalty tier and icon
    const userTier = (profile.loyaltyTier || 'Chưa xếp hạng') as LoyaltyTier;
    const TierIcon = tierIcons[userTier] || tierIcons['Chưa xếp hạng'];

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/cms/admin/customers">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to Customers</span>
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>{profile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hạng thành viên</CardTitle>
                        <TierIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{profile.loyaltyTier || 'Chưa xếp hạng'}</div>
                    </CardContent>
                </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Điểm tích lũy</CardTitle>
                        <StarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile.loyaltyPoints?.toLocaleString() || 0}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CustomerInfoForm profile={profile} />
                </div>
                <div className="space-y-6">
                    <CustomerRoleForm profile={profile} />
                    <CustomerLoyaltyForm 
                        profile={profile} 
                        loyaltySettings={siteConfig.loyalty} 
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử đơn hàng</CardTitle>
                    <CardDescription>Danh sách tất cả các đơn hàng của khách hàng này.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã đơn hàng</TableHead>
                                <TableHead>Ngày đặt</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Tổng tiền</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order: any) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/cms/admin/orders/${order.id}`} className="hover:underline text-primary font-mono">
                                            {order.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                </TableRow>
                            ))}
                            {orders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Khách hàng này chưa có đơn hàng nào.
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
