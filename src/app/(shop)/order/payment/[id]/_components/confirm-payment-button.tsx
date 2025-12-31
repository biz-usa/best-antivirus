
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { updateOrderStatus } from "@/app/cms/admin/orders/actions";
import { useAuth } from "@/context/auth-context";

interface ConfirmPaymentButtonProps {
    orderId: string;
    currentStatus: string;
}

export function ConfirmPaymentButton({ orderId, currentStatus }: ConfirmPaymentButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();
    const { userProfile } = useAuth(); // Get user profile to check role

    const handleClick = () => {
        startTransition(async () => {
            if (currentStatus === 'Chờ thanh toán') {
                try {
                    await updateOrderStatus(orderId, 'Đang xử lý');
                    toast({
                        title: "Cảm ơn bạn đã xác nhận!",
                        description: "Đơn hàng của bạn đang được xử lý."
                    });
                } catch (error: any) {
                    // Log the error, and inform the user if it fails
                    console.error("Failed to update order status:", error);
                    toast({
                        variant: "destructive",
                        title: "Lỗi cập nhật",
                        description: "Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại."
                    });
                    // Stop if the update fails
                    return;
                }
            }
            
            // Determine the correct path based on user role
            const basePath = userProfile?.role === 'reseller' ? '/reseller/order-history' : '/profile/order-history';
            router.push(`${basePath}/${orderId}`);
        });
    }

    return (
        <Button onClick={handleClick} size="lg" className="w-full" disabled={isPending}>
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Tôi đã thanh toán / Quay lại chi tiết đơn hàng
        </Button>
    )
}
