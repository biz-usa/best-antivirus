
'use client';

import { getProductById } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, PlusCircle, Sparkles, LoaderCircle, Save, FileText, Search, KeyRound, ArrowLeft } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import type { Product, ProductVariant, UsedLicenseKey } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { generateGuide, findDownloadLink } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateProductAssets } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useImmer } from 'use-immer';
import Link from "next/link";


function PageSkeleton() {
    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-5 w-72 mt-2" />
                    </div>
                </div>
            </header>
             <Card>
                <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                <CardContent><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
        </div>
    )
}

const VariantAssetsEditor = React.memo(function VariantAssetsEditor({ 
    variant, 
    onUpdate,
    isBusy,
}: { 
    variant: ProductVariant, 
    onUpdate: (variantId: string, field: 'downloadUrl' | 'licenseKeys', value: any) => void,
    isBusy: boolean,
}) {
    const { toast } = useToast();
    const licenseFileInputRef = useRef<HTMLInputElement>(null);
    const [localKeys, setLocalKeys] = useState((variant.licenseKeys?.available || []).join('\n'));
    
    useEffect(() => {
        setLocalKeys((variant.licenseKeys?.available || []).join('\n'));
    }, [variant.licenseKeys?.available]);


    const handleLicenseFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const keysFromFile = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
                const currentKeys = localKeys.split('\n').filter(k => k.trim() !== '');
                const newKeys = [...new Set([...currentKeys, ...keysFromFile])];
                const newKeysString = newKeys.join('\n');
                
                setLocalKeys(newKeysString);
                onUpdate(variant.id, 'licenseKeys', {
                    available: newKeys,
                    used: variant.licenseKeys?.used || [],
                });

                toast({
                    title: "Đã nhập!",
                    description: `${keysFromFile.length} license key đã được nhập và thêm vào danh sách.`,
                });
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleDownloadUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        onUpdate(variant.id, 'downloadUrl', newUrl);
    };

    const handleKeysBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const newKeysString = e.target.value;
        onUpdate(variant.id, 'licenseKeys', {
            available: newKeysString.split('\n').filter(k => k.trim() !== ''),
            used: variant.licenseKeys?.used || [],
        });
    };
    
    const totalAvailableKeys = localKeys.split('\n').filter(k => k.trim() !== '').length;
    const totalUsedKeys = variant.licenseKeys?.used?.length || 0;

    return (
         <Card className="bg-secondary/50">
             <input
                type="file"
                ref={licenseFileInputRef}
                onChange={handleLicenseFileChange}
                className="hidden"
                accept=".txt,.csv"
            />
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Tài nguyên biến thể: <span className="text-primary">{variant.name}</span>
                </CardTitle>
                <CardDescription>Mỗi biến thể có thể có link tải và kho license key riêng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">URL tải về</label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="https://example.com/download.zip"
                                defaultValue={variant.downloadUrl || ''}
                                onBlur={handleDownloadUrlBlur}
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                         <div className="flex items-center justify-between">
                             <label className="text-sm font-medium">License Keys có sẵn ({totalAvailableKeys})</label>
                             <Button size="xs" variant="outline" onClick={() => licenseFileInputRef.current?.click()} disabled={isBusy}>
                                <FileText className="mr-2 h-3.5 w-3.5" />
                                Nhập từ tệp
                            </Button>
                         </div>
                        <Textarea
                            placeholder="KEY-1234-ABCD-5678..."
                            value={localKeys}
                            onChange={(e) => setLocalKeys(e.target.value)}
                            onBlur={handleKeysBlur}
                            disabled={isBusy}
                            className="font-mono h-24"
                        />
                    </div>
                </div>
                 {totalUsedKeys > 0 && (
                     <div className="space-y-2">
                        <label className="text-sm font-medium">License Keys đã sử dụng ({totalUsedKeys})</label>
                         <Textarea
                            readOnly
                            value={variant.licenseKeys?.used.map(k => `${k.key} (Đơn hàng: ${k.orderId})`).join('\n')}
                            className="font-mono bg-muted"
                            rows={Math.min(5, totalUsedKeys)}
                        />
                    </div>
                 )}
            </CardContent>
        </Card>
    );
});


export default function DigitalAssetManagementPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const { toast } = useToast();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  
  // State for assets
  const [variantsData, setVariantsData] = useImmer<ProductVariant[]>([]);
  const [guideContent, setGuideContent] = useState<string>('');


  useEffect(() => {
    async function fetchProduct() {
        if (!productId) return;
        setIsLoading(true);
        const fetchedProduct = await getProductById(productId);
        if (fetchedProduct) {
            setProduct(fetchedProduct);
            setVariantsData(fetchedProduct.variants || []);
            setGuideContent(fetchedProduct.guide || '');
            if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
                setSelectedVariantId(fetchedProduct.variants[0].id);
            }
        }
        setIsLoading(false);
    }
    fetchProduct();
  }, [productId, setVariantsData]);

  const handleVariantDataUpdate = useCallback((variantId: string, field: 'downloadUrl' | 'licenseKeys', value: any) => {
      setVariantsData(draft => {
        const variantIndex = draft.findIndex(v => v.id === variantId);
        if (variantIndex !== -1) {
            draft[variantIndex][field] = value;
        }
      });
  }, [setVariantsData]);
  
  const handleGenerateGuide = async () => {
        if (!product) return;
        setIsGeneratingGuide(true);
        try {
            const result = await generateGuide({ 
                productName: product.name,
                productDescription: product.shortDescription 
            });
            setGuideContent(result);
            toast({
                title: "Đã tạo hướng dẫn!",
                description: `AI đã tạo một bài hướng dẫn cho sản phẩm.`
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi!",
                description: "Không thể tạo hướng dẫn bằng AI."
            });
        } finally {
            setIsGeneratingGuide(false);
        }
    }


  const handleSaveChanges = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
        await updateProductAssets(product.id!, {
            variants: variantsData,
            guide: guideContent,
        });
        toast({
            title: "Đã lưu!",
            description: "Tài nguyên số của sản phẩm đã được cập nhật."
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Lỗi!",
            description: "Không thể lưu thay đổi. Vui lòng thử lại."
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const isBusy = isLoading || isSaving || isGeneratingGuide;
  
  if (isLoading || !product) {
    return <PageSkeleton />;
  }
  
  const selectedVariant = variantsData.find(v => v.id === selectedVariantId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <Button variant="outline" asChild className="mb-4">
                <Link href="/cms/admin/digital-assets">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Link>
            </Button>
            <div className="flex items-center gap-4">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="rounded-lg border"
                    data-ai-hint={product.imageHint}
                />
                <div>
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <p className="text-muted-foreground">Quản lý tài nguyên số cho từng biến thể sản phẩm.</p>
                </div>
            </div>
        </div>
         <Button onClick={handleSaveChanges} disabled={isBusy}>
            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu tất cả thay đổi
        </Button>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Quản lý Biến thể</CardTitle>
            <CardDescription>Chọn một biến thể từ danh sách bên dưới để quản lý license keys và link tải về cho nó.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tên biến thể</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Keys có sẵn</TableHead>
                        <TableHead>Keys đã dùng</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variantsData.map(variant => (
                        <TableRow 
                            key={variant.id} 
                            className={selectedVariantId === variant.id ? 'bg-primary/5' : ''}
                        >
                            <TableCell className="font-medium">{variant.name}</TableCell>
                            <TableCell>{variant.sku}</TableCell>
                            <TableCell>{(variant.licenseKeys?.available || []).length}</TableCell>
                            <TableCell>{(variant.licenseKeys?.used || []).length}</TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant={selectedVariantId === variant.id ? 'default' : 'outline'} 
                                    size="sm"
                                    onClick={() => setSelectedVariantId(variant.id)}
                                >
                                    {selectedVariantId === variant.id ? 'Đang chọn' : 'Chọn quản lý'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      {selectedVariant && (
        <VariantAssetsEditor 
            key={selectedVariant.id}
            variant={selectedVariant}
            onUpdate={handleVariantDataUpdate}
            isBusy={isBusy}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hướng dẫn sử dụng chung</CardTitle>
            <CardDescription>
              Hướng dẫn này áp dụng cho tất cả các biến thể của sản phẩm.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateGuide}
            disabled={isBusy}
          >
            {isGeneratingGuide ? (
              <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-3.5 w-3.5" />
            )}
            Tạo bằng AI
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="# Hướng dẫn cài đặt..."
            className="min-h-[200px] font-mono"
            value={guideContent}
            onChange={(e) => setGuideContent(e.target.value)}
            disabled={isBusy}
          />
        </CardContent>
      </Card>

    </div>
  );

}
