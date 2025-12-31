import { CartItems } from "@/components/cart-items";
import { 
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { DiscountCodeForm } from "@/components/discount-code-form";

export default function CartPage() {

    return (
        <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Giỏ hàng của bạn</CardTitle>
                        <CardDescription>Xem lại và chỉnh sửa các mặt hàng trong giỏ hàng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CartItems view="cart" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                 <CartItems view="summary" />
                 <DiscountCodeForm />
            </div>
        </div>
    )
}
