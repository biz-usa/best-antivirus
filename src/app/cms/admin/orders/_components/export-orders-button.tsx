
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { exportOrders } from "../actions";
import { LoaderCircle, File } from "lucide-react";

interface ExportOrdersButtonProps {
    userId?: string; // Optional: to export orders for a specific user
}

// Helper function to convert base64 to a Blob
function base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}


export function ExportOrdersButton({ userId }: ExportOrdersButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleExport = () => {
        startTransition(async () => {
            try {
                const { content, fileName, contentType } = await exportOrders(userId);
                
                if (!content) {
                    throw new Error("Không có nội dung để xuất.");
                }

                const blob = base64ToBlob(content, contentType);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                toast({
                    title: "Thành công!",
                    description: "Báo cáo đơn hàng đã được xuất."
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi!",
                    description: error.message || "Không thể xuất báo cáo."
                });
            }
        });
    }

    return (
        <Button onClick={handleExport} disabled={isPending} variant="outline">
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {!isPending && <File className="mr-2 h-4 w-4" />}
            Xuất báo cáo
        </Button>
    )
}
