

'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  value: string;
  onValueChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function FileUploader({ value, onValueChange, folder = 'uploads', className }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size / 1024 / 1024 > 5) {
      toast({
        variant: 'destructive',
        title: 'File quá lớn',
        description: 'Vui lòng chọn ảnh có dung lượng dưới 5MB.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const path = `${folder}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      onValueChange(downloadURL);
      toast({
        title: 'Thành công!',
        description: 'Tệp đã được tải lên.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Tải lên thất bại',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
        />
        {value ? (
            <div className="relative group h-40 rounded-md overflow-hidden border">
                <Image
                    src={value}
                    alt="Image Preview"
                    fill
                    className="object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => onValueChange('')}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ) : (
             <div 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => !isLoading && fileInputRef.current?.click()}
             >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isLoading ? (
                        <>
                            <LoaderCircle className="w-8 h-8 mb-4 text-muted-foreground animate-spin" />
                            <p className="mb-2 text-sm text-muted-foreground">Đang tải lên...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo và thả
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF hoặc SVG (tối đa 5MB)</p>
                        </>
                    )}
                </div>
            </div>
        )}
         <Input
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Hoặc dán URL hình ảnh vào đây"
            disabled={isLoading}
        />
    </div>
  );
}
