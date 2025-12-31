
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OrderSuccessPage() {
    // Here you would typically fetch order details using the session_id
    // to display a more detailed confirmation message.
    // For this example, we'll keep it simple.

    return (
        <div className="container mx-auto text-center py-16">
            <CheckCircle className="mx-auto h-24 w-24 text-green-500" />
            <h1 className="mt-6 text-4xl font-bold text-primary">Cảm ơn bạn đã đặt hàng!</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Đơn hàng của bạn đã được đặt thành công. Chúng tôi đã gửi một email xác nhận đến địa chỉ của bạn.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Button asChild>
                    <Link href="/products">Tiếp tục mua sắm</Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/profile/order-history">Xem lịch sử đơn hàng</Link>
                </Button>
            </div>
        </div>
    )
}
