
import { getPageBySlug, getSiteConfig } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const [page, siteConfig] = await Promise.all([
    getPageBySlug(slug),
    getSiteConfig()
  ]);
  
  if (!page) {
    return {
      title: "Trang không tồn tại",
    };
  }
  
  const useSeoPlugin = siteConfig.plugins?.sgSeo?.enabled;
  const title = useSeoPlugin && page.seoTitle ? page.seoTitle : page.title;
  const description = useSeoPlugin && page.seoDescription ? page.seoDescription : page.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...';
  const previousImages = (await parent).openGraph?.images || [];
  // Ensure ogImage is always a string or undefined, handling URL objects as well.
  const ogImage = siteConfig.hero?.imageUrl || (
    previousImages[0]
      ? (typeof previousImages[0] === 'string'
          ? previousImages[0]
          : (previousImages[0] instanceof URL
              ? previousImages[0].href
              : previousImages[0].url))
      : undefined
  );

  return {
    title: title,
    description: description,
    openGraph: {
        title: title,
        description: description,
        type: 'article',
        publishedTime: page.updatedAt ? new Date((page.updatedAt as any).seconds * 1000).toISOString() : new Date().toISOString(),
        url: `/pages/${page.id}`,
        images: ogImage ? [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: page.title,
          },
          ...previousImages
        ] : previousImages,
    },
     twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ogImage ? [ogImage] : [],
    },
  };
}


export default async function GenericPage({ params }: Props) {
    const { slug } = await params;
    const page = await getPageBySlug(slug);

    if (!page) {
        notFound();
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header>
                <h1 className="text-4xl font-bold tracking-tight text-primary">{page.title}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Cập nhật lần cuối: {new Date((page.updatedAt as any).seconds * 1000).toLocaleDateString('vi-VN')}
                </p>
            </header>
            <Card>
                <CardContent className="p-6">
                    <div
                        className="prose dark:prose-invert max-w-none [&_a]:text-primary [&_img]:rounded-md [&_img]:border"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
