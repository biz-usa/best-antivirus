
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SiteSettingsForm } from './site-settings-form';
import type { SiteConfig } from '@/lib/types';
import { HeroSettingsForm } from './hero-settings-form';
import { SecondaryFeaturesForm } from './secondary-features-form';
import { PopularCategoriesForm } from './popular-categories-form';
import { FeaturedProductsForm } from './featured-products-form';
import { PartnersForm } from './partners-form';
import { FooterSettingsForm } from './footer-settings-form';
import type { Product } from '@/lib/types';
import { CompanyInfoForm } from './company-info-form';

interface AppearanceFormProps {
  initialData: SiteConfig;
  products: Product[];
}

export function AppearanceForm({ initialData, products }: AppearanceFormProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={['general']}
      className="w-full space-y-4"
    >
      <AccordionItem value="general">
        <AccordionTrigger className="text-lg font-medium">
          Cài đặt chung
        </AccordionTrigger>
        <AccordionContent>
          <SiteSettingsForm
            initialData={{
              theme: initialData.theme,
              header: initialData.header,
            }}
          />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="company_info">
        <AccordionTrigger className="text-lg font-medium">
          Thông tin Công ty
        </AccordionTrigger>
        <AccordionContent>
            <CompanyInfoForm initialData={initialData.companyInfo} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="hero">
        <AccordionTrigger className="text-lg font-medium">
          Khu vực Hero
        </AccordionTrigger>
        <AccordionContent>
          <HeroSettingsForm siteConfig={initialData} />
        </AccordionContent>
      </AccordionItem>

       <AccordionItem value="secondary_features">
        <AccordionTrigger className="text-lg font-medium">
          Tính năng phụ
        </AccordionTrigger>
        <AccordionContent>
          <SecondaryFeaturesForm initialData={initialData.secondaryFeatures} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="popular_categories">
        <AccordionTrigger className="text-lg font-medium">
          Danh mục phổ biến
        </AccordionTrigger>
        <AccordionContent>
          <PopularCategoriesForm initialData={initialData.popularCategories} />
        </AccordionContent>
      </AccordionItem>

       <AccordionItem value="featured_products">
        <AccordionTrigger className="text-lg font-medium">
          Sản phẩm nổi bật
        </AccordionTrigger>
        <AccordionContent>
          <FeaturedProductsForm initialData={initialData.featuredProducts} products={products} />
        </AccordionContent>
      </AccordionItem>

       <AccordionItem value="partners">
        <AccordionTrigger className="text-lg font-medium">
          Đối tác
        </AccordionTrigger>
        <AccordionContent>
          <PartnersForm initialData={initialData.partners} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="footer">
        <AccordionTrigger className="text-lg font-medium">
          Chân trang (Footer)
        </AccordionTrigger>
        <AccordionContent>
            <FooterSettingsForm initialData={initialData.footer} />
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
