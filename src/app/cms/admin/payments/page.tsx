
import { getSiteConfig } from "@/lib/data";
import { PaymentMethodsForm } from "./_components/payment-methods-form";


export default async function AdminPaymentsPage() {
    const config = await getSiteConfig();
    
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-semibold">Cổng thanh toán</h1>
                <p className="text-muted-foreground mt-1">
                    Kích hoạt hoặc vô hiệu hóa các phương thức thanh toán có sẵn cho khách hàng.
                </p>
            </div>
            <PaymentMethodsForm initialData={config} />
        </div>
    )
}
