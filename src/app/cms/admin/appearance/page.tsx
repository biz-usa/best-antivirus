

import { getProducts, getSiteConfig } from "@/lib/data";
import { AppearanceForm } from "./_components/appearance-form";
import { serializeForClient } from "@/lib/serializeForClient";
import Link from "next/link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ShopSettingsForm } from "./_components/shop-settings-form";


export default async function AdminAppearancePage() {
    const [config, products] = await Promise.all([
        getSiteConfig(),
        getProducts()
    ]);

    const safeProducts = products.map(serializeForClient);
    
    return (
        <div className="space-y-6">
            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">Cài đặt chung</TabsTrigger>
                    <TabsTrigger value="shop">Cài đặt Cửa hàng</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6">
                     <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-semibold">Giao diện chung</h1>
                            <p className="text-muted-foreground mt-1">
                                Tùy chỉnh giao diện và nội dung của trang web công khai.
                            </p>
                        </div>
                        <AppearanceForm initialData={config} products={safeProducts} />
                    </div>
                </TabsContent>
                <TabsContent value="shop" className="mt-6">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-semibold">Cài đặt Cửa hàng</h1>
                            <p className="text-muted-foreground mt-1">
                                Quản lý bộ lọc, từ khóa tìm kiếm và các yếu tố khác của trang cửa hàng.
                            </p>
                        </div>
                       <ShopSettingsForm initialData={config} />
                    </div>
                </TabsContent>
            </Tabs>
           
        </div>
    )
}
