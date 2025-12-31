

'use client';

import type { CampaignHistoryItem, CustomerInfo } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, MailWarning, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CampaignHistoryTableProps {
  history: CampaignHistoryItem[];
  onReuse: (campaign: CampaignHistoryItem) => void;
  loading: boolean;
}

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const audienceMap = {
  all: 'Tất cả khách hàng',
  unpaid: 'Đơn hàng chưa thanh toán',
  active_30: 'Hoạt động (30 ngày)',
  active_90: 'Hoạt động (90 ngày)',
  inactive_90: 'Không hoạt động (90+ ngày)',
};

const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
    </TableRow>
);

const RecipientsDialog = ({ recipients = [] }: { recipients?: CustomerInfo[] }) => (
    <DialogContent className="max-w-2xl">
        <DialogHeader>
            <DialogTitle>Danh sách người nhận</DialogTitle>
            <DialogDescription>
                Danh sách các khách hàng đã nhận được email trong chiến dịch này.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recipients.length > 0 ? (
                        recipients.map((recipient, index) => (
                            <TableRow key={recipient.id || index}>
                                <TableCell>{recipient.name}</TableCell>
                                <TableCell>{recipient.email}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center">Không có dữ liệu người nhận.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    </DialogContent>
)


export function CampaignHistoryTable({ history, onReuse, loading }: CampaignHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử gửi email</CardTitle>
        <CardDescription>
          Xem lại các chiến dịch đã gửi và tái sử dụng nội dung của chúng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                 Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : history.length > 0 ? (
              history.map((campaign) => (
                 <Dialog key={campaign.id}>
                    <TableRow>
                    <TableCell className="font-medium max-w-xs truncate" title={campaign.subject}>
                        {campaign.subject}
                    </TableCell>
                    <TableCell>{formatDate(campaign.sentAt)}</TableCell>
                    <TableCell>{campaign.sentCount}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{audienceMap[campaign.targetAudience] || campaign.targetAudience}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                       <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                       </DialogTrigger>
                       
                       <Dialog>
                           <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="h-4 w-4" /></Button>
                           </DialogTrigger>
                           <RecipientsDialog recipients={campaign.recipients} />
                       </Dialog>

                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReuse(campaign)}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                     <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Xem trước: {campaign.subject}</DialogTitle>
                          <DialogDescription className="sr-only">Nội dung email xem trước.</DialogDescription>
                        </DialogHeader>
                        <div className="overflow-y-auto p-4 border rounded-md h-full bg-background flex-grow">
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: campaign.content }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                   <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MailWarning className="h-10 w-10" />
                        <p className="font-medium">Chưa có chiến dịch nào.</p>
                        <p className="text-sm">Hãy qua tab "Soạn thảo" để bắt đầu gửi email.</p>
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
