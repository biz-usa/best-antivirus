

'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useState, useTransition } from "react";
import { applyDiscountCode } from "@/app/cms/admin/discounts/actions";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Ticket, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DiscountCodeForm() {
    const [code, setCode] = useState('');
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const { applyDiscount, removeDiscount, appliedDiscount, loyaltyDiscountAmount } = useCartStore();
    const loyaltyDiscount = loyaltyDiscountAmount();

    const handleApplyCode = () => {
        if (!code) return;
        startTransition(async () => {
            try {
                const discount = await applyDiscountCode(code);
                applyDiscount(discount);
                toast({
                    title: "Thành công!",
                    description: `Đã áp dụng mã giảm giá "${discount.code}".`
                });
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: error.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn."
                });
            }
        });
    }
    
    const handleRemoveCode = () => {
        removeDiscount();
        toast({
            title: "Đã xóa mã giảm giá."
        });
    }

    if (loyaltyDiscount > 0 && !appliedDiscount) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Ưu đãi khách hàng thân thiết</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between p-3 rounded-md bg-secondary text-secondary-foreground">
                        <div className="flex items-center gap-2">
                             <Ticket className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-sm">Đang áp dụng giảm giá thành viên</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (appliedDiscount) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Mã giảm giá đã áp dụng</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between p-3 rounded-md bg-secondary text-secondary-foreground">
                        <div className="flex items-center gap-2">
                             <Ticket className="h-5 w-5 text-green-500" />
                            <span className="font-mono font-semibold">{appliedDiscount.code}</span>
                        </div>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveCode}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle>Mã giảm giá</CardTitle>
                <CardDescription>Bạn có mã giảm giá? Hãy nhập vào đây.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Nhập mã giảm giá"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        disabled={isPending}
                    />
                    <Button onClick={handleApplyCode} disabled={isPending || !code}>
                        {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Áp dụng
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
