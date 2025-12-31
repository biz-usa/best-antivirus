import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function OrderErrorPage() {

    return (
        <div className="container mx-auto text-center py-16">
            <XCircle className="mx-auto h-24 w-24 text-destructive" />
            <h1 className="mt-6 text-4xl font-bold text-primary">Đã có lỗi xảy ra</h1>
            <p className="mt-4 text-lg text-muted-foreground">
               Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Button asChild>
                    <Link href="/cart">Quay lại giỏ hàng</Link>
                </Button>
                 <Button variant="outline" asChild>
                    <Link href="/products">Tiếp tục mua sắm</Link>
                </Button>
            </div>
        </div>
    )
}
