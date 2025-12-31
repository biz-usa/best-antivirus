
import { getOrderById, getSiteConfig } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "./_components/copy-button";
import { ConfirmPaymentButton } from "./_components/confirm-payment-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QRCodeCanvas } from 'qrcode.react';


const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
}).format(amount);

type Props = {
    params: Promise<{ id: string }>
}

export default async function PaymentPage({ params }: Props) {
    const { id: orderId } = await params;
    const [order, siteConfig] = await Promise.all([
        getOrderById(orderId),
        getSiteConfig()
    ]);

    if (!order) {
        notFound();
    }
    
    const isVietQR = order.paymentMethod === 'vietqr';
    const isZaloPay = order.paymentMethod === 'zalopay';
    const paymentData = order.paymentData;

    let qrCodeUrl: string | null | undefined = null;
    if (isVietQR) {
        // Use the provided static base URL and append dynamic order info
        const baseVietQrUrl = "https://api.vietqr.io/image/970423-01810729501-IklGnM3.jpg";
        const accountName = siteConfig.paymentMethods.vietqr.accountName || "";
        const amount = order.total;
        
        // Append dynamic parameters for amount and order info
        const urlParams = new URLSearchParams({
            amount: amount.toString(),
            addInfo: `${orderId} - ${accountName}`.trim(),
            accountName: accountName,
        });
        
        qrCodeUrl = `${baseVietQrUrl}?${urlParams.toString()}`;

    } else if (isZaloPay) {
        // ZaloPay's order_url is the content for the QR code
        qrCodeUrl = paymentData?.order_url;
    }


    return (
        <div className="max-w-4xl mx-auto py-8">
             <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href={`/profile/order-history/${orderId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại chi tiết đơn hàng
                    </Link>
                </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left Side - QR Code and Instructions */}
                <div className="space-y-6">
                    <Card className="bg-primary/5">
                        <CardHeader>
                            <CardTitle>Quét mã để thanh toán</CardTitle>
                            <CardDescription>
                                Sử dụng ứng dụng {isVietQR ? "ngân hàng" : "ZaloPay"} của bạn để quét mã QR bên dưới.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center p-4">
                           {qrCodeUrl && isVietQR ? (
                             <Image
                                src={qrCodeUrl}
                                alt={`Mã QR thanh toán cho đơn hàng ${orderId}`}
                                width={300}
                                height={300}
                                className="rounded-lg border-4 border-primary shadow-lg"
                                priority
                            />
                           ) : qrCodeUrl && isZaloPay ? (
                            <div className="p-4 bg-white rounded-lg border-4 border-primary shadow-lg">
                                <QRCodeCanvas value={qrCodeUrl} size={284} />
                            </div>
                           ) : (
                            <div className="w-[300px] h-[300px] bg-muted flex items-center justify-center rounded-lg border">
                                <p className="text-sm text-muted-foreground p-4">Chưa cấu hình thông tin thanh toán trong CMS để tạo mã QR.</p>
                            </div>
                           )}
                            <p className="mt-4 text-sm text-muted-foreground">
                                Đảm bảo nội dung chuyển khoản là <strong className="font-mono text-primary">{orderId}</strong>
                            </p>
                             {isZaloPay && paymentData?.order_url && (
                                <Button asChild className="mt-4">
                                    <a href={paymentData.order_url} target="_blank" rel="noopener noreferrer">
                                        Thanh toán qua ZaloPay
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <CardTitle>Hướng dẫn thanh toán</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-3">
                            <p><strong>Bước 1:</strong> Mở ứng dụng {isVietQR ? "ngân hàng" : "ZaloPay"} và chọn tính năng quét mã QR.</p>
                            <p><strong>Bước 2:</strong> Quét mã QR ở trên. Thông tin người nhận, số tiền và nội dung sẽ được tự động điền.</p>
                            <p><strong>Bước 3:</strong> Kiểm tra lại thông tin và hoàn tất giao dịch.</p>
                             <p><strong>Bước 4:</strong> Sau khi thanh toán, nhấn vào nút "Tôi đã thanh toán" bên cạnh để chúng tôi xử lý đơn hàng.</p>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Right Side - Order Summary and Manual Info */}
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tóm tắt đơn hàng</CardTitle>
                            <CardDescription>
                                Đơn hàng <span className="font-mono font-semibold text-primary">{orderId}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="divide-y divide-border text-sm">
                                {order.items.map(item => (
                                    <div key={item.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                                        </div>
                                        <p>{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardContent className="pt-4">
                             <div className="w-full space-y-2 text-sm ml-auto">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tạm tính</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Thuế GTGT</span>
                                    <span>{formatCurrency(order.vat)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Tổng cộng</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isVietQR && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Thông tin chuyển khoản thủ công</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Ngân hàng</span>
                                    <span className="font-semibold uppercase">{siteConfig.paymentMethods.vietqr.bankShortName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Chủ tài khoản</span>
                                    <span className="font-semibold">{siteConfig.paymentMethods.vietqr.accountName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Số tài khoản</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold font-mono">{siteConfig.paymentMethods.vietqr.accountNumber || 'Chưa cập nhật'}</span>
                                        <CopyButton textToCopy={siteConfig.paymentMethods.vietqr.accountNumber || ''} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Số tiền</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold font-mono">{formatCurrency(order.total)}</span>
                                        <CopyButton textToCopy={String(order.total)} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-muted-foreground pt-1">Nội dung</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="font-mono text-right">{orderId}</Badge>
                                        <CopyButton textToCopy={orderId} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                     <ConfirmPaymentButton orderId={order.id} currentStatus={order.status} />
                </div>

            </div>
        </div>
    );
}
