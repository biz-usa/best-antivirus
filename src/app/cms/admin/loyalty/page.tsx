

import { getSiteConfig } from "@/lib/data";
import { LoyaltySettingsForm } from "./_components/loyalty-settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default async function LoyaltyAdminPage() {
    const config = await getSiteConfig();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Chương trình Khách hàng Thân thiết</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý chương trình khách hàng thân thiết cho hai nhóm: Khách hàng (Customer) và Đối tác (Reseller).
                </p>
            </div>
             <Tabs defaultValue="customer">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="customer">Chương trình cho Customer</TabsTrigger>
                    <TabsTrigger value="reseller">Chương trình cho Reseller</TabsTrigger>
                </TabsList>
                <TabsContent value="customer">
                    <LoyaltySettingsForm 
                        initialData={config.loyalty} 
                        programType="customer"
                    />
                </TabsContent>
                <TabsContent value="reseller">
                     <LoyaltySettingsForm 
                        initialData={config.loyalty} 
                        programType="reseller"
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
