
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Product, UsedLicenseKey as OriginalUsedLicenseKey } from "@/lib/types";
import { ClipboardCopy, Download, KeyRound } from "lucide-react";
import Link from 'next/link';

// The data from the server will have the timestamp as a string
type ClientUsedLicenseKey = Omit<OriginalUsedLicenseKey, 'assignedAt'> & {
  assignedAt: string;
};

interface OrderItemActionsProps {
  product: Product | null;
  licenseKeys: ClientUsedLicenseKey[];
}

export function OrderItemActions({ product, licenseKeys }: OrderItemActionsProps) {
    const { toast } = useToast();

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({
        title: 'Đã sao chép!',
        description: 'License key đã được sao chép vào bộ nhớ tạm.',
        });
    };

    if (!product) return null;

    const hasDownloadLink = !!product.variants?.find(v => v.downloadUrl)?.downloadUrl;
    const hasLicenseKeys = licenseKeys && licenseKeys.length > 0;

  return (
     <AlertDialog>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline" disabled={!hasDownloadLink}>
            <Link href={`/profile/downloads`}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Tải về
            </Link>
        </Button>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={!hasLicenseKeys}>
            <KeyRound className="mr-2 h-3.5 w-3.5" />
            Xem Keys
          </Button>
        </AlertDialogTrigger>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>License Keys cho {product.name}</AlertDialogTitle>
          <AlertDialogDescription>
            Đây là(các) license key của bạn. Sao chép và sử dụng chúng để kích hoạt phần mềm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-60 w-full rounded-md border p-4">
            {hasLicenseKeys ? (
                <div className="space-y-4">
                    {licenseKeys.map((lk, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={lk.key}
                                className="flex-grow bg-muted border rounded-md px-3 py-1.5 text-sm font-mono"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0"
                                onClick={() => handleCopyKey(lk.key)}
                            >
                                <ClipboardCopy className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                    Không có license key nào được gán cho sản phẩm này.
                </div>
            )}
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel>Đóng</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
