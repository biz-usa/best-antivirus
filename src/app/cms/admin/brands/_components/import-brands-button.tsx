
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { importBrands } from '../actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getBrands } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface PreviewState {
  newBrands: string[];
  skippedBrands: string[];
  isOpen: boolean;
}

export function ImportBrandsButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ newBrands: [], skippedBrands: [], isOpen: false });
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const brandNamesFromFile = [...new Set(
            text.split(/[\r\n,]+/)
                .map(name => name.trim())
                .filter(name => name.length > 0)
        )];

        if (brandNamesFromFile.length === 0) {
            throw new Error("Tệp không chứa tên thương hiệu nào hợp lệ.");
        }

        // Fetch existing brands to compare
        const existingBrands = await getBrands();
        const existingBrandNamesLower = new Set(existingBrands.map(b => b.toLowerCase()));

        const newBrands: string[] = [];
        const skippedBrands: string[] = [];

        brandNamesFromFile.forEach(name => {
            if (existingBrandNamesLower.has(name.toLowerCase())) {
                skippedBrands.push(name);
            } else {
                newBrands.push(name);
            }
        });

        setPreview({ newBrands, skippedBrands, isOpen: true });

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Đã có lỗi xảy ra',
          description: error.message || 'Không thể xử lý tệp.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  
  const handleConfirmImport = async () => {
    setIsLoading(true);
    setPreview(p => ({ ...p, isOpen: false }));
    try {
        const result = await importBrands(preview.newBrands);
        toast({
          title: 'Hoàn tất nhập liệu!',
          description: `Đã thêm ${result.added} thương hiệu mới.`,
        });
    } catch (error: any) {
         toast({
          variant: 'destructive',
          title: 'Lỗi nhập liệu!',
          description: error.message || 'Không thể thêm thương hiệu từ tệp.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.csv"
      />
      <Button
        variant="destructive"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Nhập từ tệp
      </Button>

      <AlertDialog open={preview.isOpen} onOpenChange={(isOpen) => setPreview(p => ({ ...p, isOpen }))}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xem trước khi nhập thương hiệu</AlertDialogTitle>
            <AlertDialogDescription>
              Kiểm tra danh sách các thương hiệu sẽ được thêm và các thương hiệu bị bỏ qua. Nhấn "Xác nhận" để hoàn tất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh]">
            <div className="space-y-2">
                <h3 className="font-semibold">Thương hiệu mới sẽ được thêm ({preview.newBrands.length})</h3>
                 <ScrollArea className="h-64 w-full rounded-md border">
                   <div className="p-4 text-sm space-y-1">
                     {preview.newBrands.length > 0 ? (
                        preview.newBrands.map((brand, i) => <p key={i}>{brand}</p>)
                     ) : (
                        <p className="text-muted-foreground italic">Không có thương hiệu mới nào.</p>
                     )}
                   </div>
                 </ScrollArea>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold">Thương hiệu bị bỏ qua (đã tồn tại) ({preview.skippedBrands.length})</h3>
                <ScrollArea className="h-64 w-full rounded-md border">
                    <div className="p-4 text-sm space-y-1">
                        {preview.skippedBrands.length > 0 ? (
                            preview.skippedBrands.map((brand, i) => <p key={i} className="text-muted-foreground">{brand}</p>)
                        ) : (
                            <p className="text-muted-foreground italic">Không có thương hiệu nào bị bỏ qua.</p>
                        )}
                    </div>
                </ScrollArea>
             </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} disabled={isLoading || preview.newBrands.length === 0}>
              {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận & Nhập
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
