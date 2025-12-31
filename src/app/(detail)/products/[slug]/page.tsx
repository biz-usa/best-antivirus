
import { getProductBySlug, getSiteConfig, getProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import { serializeForClient } from '@/lib/serializeForClient';
import { ProductDetailClient } from './_components/product-detail-client';
import type { Metadata, ResolvingMetadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const [product, siteConfig] = await Promise.all([
    getProductBySlug(slug),
    getSiteConfig()
  ]);
  
  if (!product) {
    return {
      title: 'Sản phẩm không tồn tại',
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const cheapestVariant = product.variants?.reduce((prev, curr) => 
    (curr.salePrice || curr.price) < (prev.salePrice || curr.price) ? curr : prev, product.variants[0]
  );
  const isInStock = product.variants?.some(v => v.licenseKeys?.available && v.licenseKeys.available.length > 0);
  
  const useSeoPlugin = siteConfig.plugins?.sgSeo?.enabled;
  const title = useSeoPlugin && product.seoTitle ? product.seoTitle : product.name;
  const description = useSeoPlugin && product.seoDescription ? product.seoDescription : product.shortDescription;

  // Generate JSON-LD for structured data, which is the correct way to provide product info
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.shortDescription,
    sku: cheapestVariant?.sku || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: String(cheapestVariant?.salePrice || cheapestVariant?.price || 0),
      itemCondition: 'https://schema.org/NewCondition',
      availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/products/${product.slug}`,
    },
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    // Add other product properties as needed
  };

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
        ...previousImages,
      ],
      type: 'website',
      url: `/products/${product.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [product.imageUrl],
    },
    // Add JSON-LD script for rich snippets
    alternates: {
        canonical: `/products/${product.slug}`,
    },
    // @ts-ignore - Next.js expects a specific JSON-LD format
    "@context": "https://schema.org",
    "@graph": [
        jsonLd,
    ],
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const productData = await getProductBySlug(slug);

  if (!productData) {
    notFound();
  }

  const related = (await getProducts(productData.category.slug))
      .filter((p) => p.id !== productData.id)
      .slice(0, 4);

  const product = serializeForClient(productData);
  const relatedProducts = serializeForClient(related);

  return (
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
  );
}
