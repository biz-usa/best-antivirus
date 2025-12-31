

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Download, Database, FileText, FileCode2, FileSpreadsheet } from 'lucide-react';
import { exportProducts } from '../actions';
import type { ExportFormat } from '../actions';


export function FeedExporter() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleExport = async (format: ExportFormat) => {
    startTransition(async () => {
      try {
        const { content, fileName, contentType } = await exportProducts(format);
        
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Thành công!',
          description: `Dữ liệu sản phẩm đã được xuất ra tệp ${fileName}.`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể xuất dữ liệu sản phẩm.',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tùy chọn xuất</CardTitle>
        <CardDescription>
          Chọn một định dạng để xuất toàn bộ dữ liệu sản phẩm hiện có.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-3">
                <FileCode2 className="h-6 w-6 text-muted-foreground" />
                <div className='space-y-0.5'>
                    <p className="font-medium">Xuất ra XML</p>
                    <p className="text-xs text-muted-foreground">Tệp có cấu trúc, phù hợp cho việc tích hợp hệ thống.</p>
                </div>
            </div>
            <Button onClick={() => handleExport('xml')} disabled={isPending}>
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Xuất XML
            </Button>
        </div>
         <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                <div className='space-y-0.5'>
                    <p className="font-medium">Xuất ra CSV (dấu phẩy)</p>
                    <p className="text-xs text-muted-foreground">Phù hợp để mở trong Excel, Google Sheets.</p>
                </div>
            </div>
            <Button onClick={() => handleExport('csv')} disabled={isPending}>
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Xuất CSV
            </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <div className='space-y-0.5'>
                    <p className="font-medium">Xuất ra TXT (tab)</p>
                    <p className="text-xs text-muted-foreground">Định dạng văn bản thuần, tương thích cao với các hệ thống feed.</p>
                </div>
            </div>
            <Button onClick={() => handleExport('txt')} disabled={isPending}>
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Xuất TXT
            </Button>
        </div>
      </CardContent>
      <CardFooter>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Tệp xuất sẽ bao gồm tất cả sản phẩm và biến thể trong cơ sở dữ liệu.</span>
          </p>
      </CardFooter>
    </Card>
  );
}
