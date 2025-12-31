
import { getProducts, getCategories, getBrands, getLicenseTypes, getSiteConfig } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { CategoryPageClient } from './_components/category-page-client';
import { serializeForClient } from '@/lib/serializeForClient';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const { slug } = await params;
    const [categories, siteConfig] = await Promise.all([
        getCategories(),
        getSiteConfig()
    ]);

    if (!siteConfig.plugins?.sgSeo?.enabled) {
        return {};
    }

    const category = categories.find(c => c.slug === slug);

    if (!category) {
        return {
            title: 'Danh mục không tồn tại'
        }
    }
    
    const previousImages = (await parent).openGraph?.images || []

    return {
        title: category.name,
        description: `Duyệt qua các sản phẩm trong danh mục ${category.name}.`,
         openGraph: {
            title: category.name,
            description: `Duyệt qua các sản phẩm trong danh mục ${category.name}.`,
            images: previousImages, // Inherit images from parent layout
        },
    }
}


export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    
    const [initialProducts, allCategories, brands, licenseTypes, siteConfig] = await Promise.all([
        getProducts(slug),
        getCategories(),
        getBrands(),
        getLicenseTypes(),
        getSiteConfig(),
    ]);
    
    const category = allCategories.find((c) => c.slug === slug);
    if (!category) {
        notFound();
    }

    return (
        <CategoryPageClient
            initialProducts={serializeForClient(initialProducts)}
            allCategories={serializeForClient(allCategories)}
            category={serializeForClient(category)}
            brands={brands}
            licenseTypes={licenseTypes}
            siteConfig={siteConfig}
        />
    )
}
