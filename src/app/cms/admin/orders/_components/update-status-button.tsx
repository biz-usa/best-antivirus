
'use client';

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { updateOrderStatus } from "../actions";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateStatusButtonProps {
    orderId: string;
    currentStatus: string;
    targetStatus: string;
    label: string;
    as?: 'menuitem' | 'button';
    onSuccess?: () => void;
}

export function UpdateStatusButton({ orderId, currentStatus, targetStatus, label, as = 'menuitem', onSuccess }: UpdateStatusButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {
        startTransition(async () => {
            try {
                await updateOrderStatus(orderId, targetStatus);
                toast({
                    title: "Thành công!",
                    description: `Đơn hàng đã được cập nhật thành "${targetStatus}".`
                });
                onSuccess?.();
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi!",
                    description: error.message || "Không thể cập nhật trạng thái đơn hàng."
                });
            }
        });
    }

    if (currentStatus === targetStatus) {
        return null;
    }
    
     const variantMap = {
        'Hoàn thành': 'default',
        'Đang xử lý': 'secondary',
        'Đã hủy': 'destructive',
    } as const;

    if (as === 'menuitem') {
         return (
            <DropdownMenuItem
                onSelect={(e) => {e.preventDefault(); handleClick();}}
                disabled={isPending}
                 className={targetStatus === 'Đã hủy' ? 'text-destructive focus:text-destructive' : ''}
            >
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {label}
            </DropdownMenuItem>
        );
    }
    
    if (as === 'button') {
        return (
            <Button
                onClick={handleClick}
                disabled={isPending}
                variant={variantMap[targetStatus as keyof typeof variantMap] || 'outline'}
                size="sm"
            >
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {label}
            </Button>
        );
    }

    return null;
}
