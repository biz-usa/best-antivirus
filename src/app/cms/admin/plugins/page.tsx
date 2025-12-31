

import { getSiteConfig, getProducts, getPages } from "@/lib/data";
import { PluginsForm } from "./_components/plugins-form";
import { serializeForClient } from "@/lib/serializeForClient";


export default async function AdminPluginsPage() {
    const [config, products, pages] = await Promise.all([
        getSiteConfig(),
        getProducts(),
        getPages()
    ]);
    const safeProducts = products.map(serializeForClient);
    const safePages = pages.map(serializeForClient);
    
    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-semibold">Plugin & Add-ons</h1>
                <p className="text-muted-foreground mt-1">
                    Kích hoạt hoặc vô hiệu hóa các tính năng mở rộng trên trang web của bạn.
                </p>
            </div>
            <PluginsForm initialData={config} products={safeProducts} pages={safePages} />
        </div>
    )
}
