
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, UserX, Gem, Trophy, Star, Diamond } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { Customer, LoyaltyTier } from "@/lib/types";
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomersTableProps {
    customers: Customer[];
    isLoading: boolean;
    selectedCustomerIds: string[];
    setSelectedCustomerIds: (ids: string[]) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

const SkeletonRow = () => (
    <TableRow>
        <TableCell className="w-[50px]"><Skeleton className="h-5 w-5" /></TableCell>
        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
        <TableCell><div className="space-y-1"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-32" /></div></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
    </TableRow>
);

const tierIcons: Record<LoyaltyTier, React.ElementType> = {
    'Đồng': Star,
    'Bạc': Gem,
    'Vàng': Trophy,
    'Kim Cương': Diamond,
    'Chưa xếp hạng': UserX,
};

function LoyaltyBadge({ tier }: { tier: LoyaltyTier }) {
    const Icon = tierIcons[tier] || UserX;
    const variant = tier === 'Kim Cương' ? 'default' : tier === 'Vàng' ? 'secondary' : 'outline';
    
    return (
        <Badge variant={variant} className="flex items-center gap-1.5 w-fit">
            <Icon className="h-3.5 w-3.5" />
            <span>{tier}</span>
        </Badge>
    );
}

export function CustomersTable({ customers, isLoading, selectedCustomerIds, setSelectedCustomerIds }: CustomersTableProps) {
    const isAllSelected = customers.length > 0 && selectedCustomerIds.length === customers.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCustomerIds(customers.map(c => c.uid));
        } else {
            setSelectedCustomerIds([]);
        }
    };
    
    const handleSelectOne = (uid: string, checked: boolean) => {
        if (checked) {
            setSelectedCustomerIds([...selectedCustomerIds, uid]);
        } else {
            setSelectedCustomerIds(selectedCustomerIds.filter(id => id !== uid));
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
                        />
                    </TableHead>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Tên khách hàng</TableHead>
                    <TableHead>Hạng</TableHead>
                    <TableHead>Số đơn hàng</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                ) : customers.length > 0 ? (
                    customers.map(customer => {
                        const customerId = encodeURIComponent(customer.uid);
                        return (
                            <TableRow key={customer.uid} data-state={selectedCustomerIds.includes(customer.uid) ? "selected" : ""}>
                                <TableCell>
                                     <Checkbox
                                        checked={selectedCustomerIds.includes(customer.uid)}
                                        onCheckedChange={(checked) => handleSelectOne(customer.uid, !!checked)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link href={`/cms/admin/customers/${customerId}`} className="hover:underline">
                                        {customer.name}
                                    </Link>
                                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                                </TableCell>
                                <TableCell>
                                    <LoyaltyBadge tier={customer.loyaltyTier || 'Chưa xếp hạng'} />
                                </TableCell>
                                <TableCell>
                                    {customer.totalOrders}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
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
                                                <Link href={`/cms/admin/customers/${customerId}`}>Xem chi tiết</Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UserX className="h-10 w-10" />
                                <p className="font-medium">Không tìm thấy khách hàng nào.</p>
                                <p className="text-sm">Hãy thử thay đổi bộ lọc của bạn.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
