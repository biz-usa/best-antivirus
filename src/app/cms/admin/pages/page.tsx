

import { getPages } from "@/lib/data";
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
import Link from "next/link";
import { ArrowRight, FileText, MoreHorizontal, PlusCircle } from "lucide-react";
import { serializeForClient } from "@/lib/serializeForClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeletePageButton } from "./_components/delete-page-button";


export default async function AdminPagesPage() {
    const rawPages = await getPages();
    const pages = serializeForClient(rawPages);
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Trang nội dung</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý nội dung cho các trang tĩnh như Giới thiệu, Liên hệ, v.v.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/cms/admin/pages/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tạo trang mới
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách trang</CardTitle>
                    <CardDescription>Chọn một trang để chỉnh sửa nội dung.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên trang</TableHead>
                                <TableHead>Slug (Đường dẫn)</TableHead>
                                <TableHead className="hidden md:table-cell">Cập nhật lần cuối</TableHead>
                                <TableHead>
                                    <span className="sr-only">Hành động</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pages.length > 0 ? pages.map((page: any) => (
                                <TableRow key={page.id}>
                                    <TableCell className="font-medium">{page.title}</TableCell>
                                    <TableCell className="font-mono text-sm">/pages/{page.id}</TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {new Date(page.updatedAt).toLocaleString('vi-VN')}
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
                                                    <Link href={`/cms/admin/pages/${page.id}`}>Sửa</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DeletePageButton slug={page.id} />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                         <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <FileText className="h-10 w-10" />
                                            <p className="font-medium">Không tìm thấy trang nào.</p>
                                            <p className="text-sm">Chạy seed script để tạo các trang mặc định.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
