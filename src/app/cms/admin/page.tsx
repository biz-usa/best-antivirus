
'use server';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Package, Users, CreditCard, MoreHorizontal, BarChart } from "lucide-react"
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
import { getAdminDashboardStats, getAdminOrders } from "@/lib/admin-data"; // Use admin-data
import { RevenueChart } from "./_components/revenue-chart";


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

const getStatusVariant = (status: string) => {
    switch(status.toLowerCase()) {
        case 'hoàn thành': return 'default';
        case 'đang xử lý': return 'secondary';
        case 'đã hủy': return 'destructive';
        default: return 'outline';
    }
};


export default async function AdminDashboard() {
  const [stats, { orders: recentOrders }] = await Promise.all([
    getAdminDashboardStats(),
    getAdminOrders({ limit: 5 })
  ]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-semibold">Tổng quan</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder percentage */}
              +20.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalOrders}</div>
             <p className="text-xs text-muted-foreground">
              {/* Placeholder percentage */}
              +180.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalCustomers}</div>
             <p className="text-xs text-muted-foreground">
                 {/* Placeholder percentage */}
                +19% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {/* Placeholder text */}
              2 sản phẩm mới được thêm
            </p>
          </CardContent>
        </Card>
      </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Tổng quan doanh thu</CardTitle>
                <CardDescription>Doanh thu trong 7 ngày gần nhất</CardDescription>
                </CardHeader>
                <CardContent>
                    <RevenueChart data={stats.revenueByDay} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Đơn hàng gần đây</CardTitle>
                        <CardDescription>
                            {recentOrders.length} đơn hàng mới nhất trong tháng này.
                        </CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/cms/admin/orders">Xem tất cả</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Mã đơn hàng</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <Link href={`/cms/admin/orders/${order.id}`} className="font-mono font-medium hover:underline">
                                            {order.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                </TableRow>
                            ))}
                            {recentOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Chưa có đơn hàng nào.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
