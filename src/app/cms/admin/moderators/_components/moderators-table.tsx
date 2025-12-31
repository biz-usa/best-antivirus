

'use client';

import type { AdminUser } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserCog } from 'lucide-react';
import Link from 'next/link';
import { DeleteModeratorButton } from './delete-moderator-button';

interface ModeratorsTableProps {
  users: AdminUser[];
}

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export function ModeratorsTable({ users }: ModeratorsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Danh sách quản trị viên</CardTitle>
        <CardDescription>
          Tất cả người dùng có quyền truy cập vào trang quản trị.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>
                <span className="sr-only">Hành động</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                      {user.role === 'superadmin' ? 'Super Admin' : 'Moderator'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                     {user.role !== 'superadmin' && (
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
                              <Link href={`/cms/admin/moderators/${user.id}/edit`}>
                                Sửa quyền hạn
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DeleteModeratorButton userId={user.id!} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                     )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UserCog className="h-10 w-10" />
                        <p className="font-medium">Chưa có quản trị viên nào.</p>
                        <p className="text-sm">Hãy thêm quản trị viên đầu tiên của bạn.</p>
                    </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
