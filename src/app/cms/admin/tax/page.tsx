

import { getTaxRates, getSiteConfig } from "@/lib/data";
import { TaxSettingsForm } from "./_components/tax-settings-form";

export default async function TaxSettingsPage() {
    const [taxRates, siteConfig] = await Promise.all([
        getTaxRates(),
        getSiteConfig(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Thuế</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý các quy tắc về thuế cho các quốc gia khác nhau.
                </p>
            </div>
            <TaxSettingsForm 
                initialTaxRates={taxRates} 
                initialDefaultCountry={siteConfig.tax.defaultCountryCode} 
            />
        </div>
    );
}
