
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getSiteConfig } from "@/lib/data"
import type { Product, ProductVariant, SiteConfig } from "@/lib/types"
import { BellRing, LoaderCircle } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { addStockNotification } from "./actions"

interface StockNotifierProps {
    product: Product;
    variant: ProductVariant;
}

export function StockNotifier({ product, variant }: StockNotifierProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [config, setConfig] = useState<SiteConfig['plugins']['stockNotifier'] | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function checkConfig() {
            const siteConfig = await getSiteConfig();
            setConfig(siteConfig.plugins?.stockNotifier ?? null);
        }
        checkConfig();
    }, []);

    const handleSubmit = () => {
        if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
            toast({
                variant: "destructive",
                title: "Email không hợp lệ",
                description: "Vui lòng nhập một địa chỉ email hợp lệ.",
            });
            return;
        }

        startTransition(async () => {
            try {
                await addStockNotification({
                    email,
                    productId: product.id!,
                    variantId: variant.id,
                    productName: product.name,
                    variantName: variant.name,
                    productSlug: product.slug,
                });
                 toast({
                    title: "Đã đăng ký thành công!",
                    description: config?.successMessage || "Chúng tôi sẽ thông báo cho bạn ngay khi sản phẩm có hàng trở lại.",
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Không thể lưu yêu cầu của bạn. Vui lòng thử lại.",
                });
            }
        });
    };
    
    if (!config?.enabled) {
        return (
             <Button size="lg" disabled>
                <BellRing className="mr-2 h-5 w-5" />
                Sản phẩm tạm hết hàng
            </Button>
        )
    }

    const description = (config.description || '')
        .replace('%PRODUCT_NAME%', `<strong>${product.name}</strong>`)
        .replace('%VARIANT_NAME%', `<strong>${variant.name}</strong>`);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" variant="outline">
                    <BellRing className="mr-2 h-5 w-5" />
                    Thông báo cho tôi khi có hàng
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{config.title || 'Thông báo khi có hàng trở lại'}</AlertDialogTitle>
                 <AlertDialogDescription dangerouslySetInnerHTML={{ __html: description }} />
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                        Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="m@example.com"
                            className="col-span-3"
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
                    {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng ký
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
