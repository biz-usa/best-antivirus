
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateAppearance } from '../../actions';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState, useTransition } from 'react';
import { LoaderCircle, Save, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SiteConfig } from '@/lib/types';


const shopFilterSchema = z.object({
    id: z.enum(['categories', 'brands', 'licenseTypes', 'priceRange', 'attributes', 'onSale', 'inStock', 'newArrivals']),
    name: z.string(),
    enabled: z.boolean(),
});

const checkoutSettingsSchema = z.object({
    showGoogleLogin: z.boolean(),
    showAppleLogin: z.boolean(),
})

const shopSettingsSchema = z.object({
  shop: z.object({
    popularSearches: z.array(z.string()).default([]),
    filters: z.array(shopFilterSchema).default([]),
    checkout: checkoutSettingsSchema.default({ showGoogleLogin: true, showAppleLogin: true }),
  })
});

type ShopSettingsFormValues = z.infer<typeof shopSettingsSchema>;

interface ShopSettingsFormProps {
    initialData: SiteConfig;
}


export function ShopSettingsForm({ initialData }: ShopSettingsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [newKeyword, setNewKeyword] = useState('');

  const form = useForm<ShopSettingsFormValues>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shop: {
        popularSearches: initialData.shop.popularSearches || [],
        filters: initialData.shop.filters || [],
        checkout: initialData.shop.checkout || { showGoogleLogin: true, showAppleLogin: true },
      }
    },
  });

  const onSubmit = async (data: ShopSettingsFormValues) => {
    startTransition(async () => {
         try {
            await updateAppearance({ shop: data.shop });
            toast({
                title: 'Thành công!',
                description: 'Cài đặt cửa hàng đã được cập nhật.',
            });
            form.reset(data, { keepDirtyValues: true });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Lỗi!',
                description: error.message || 'Không thể cập nhật cài đặt.',
            });
        }
    });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = form.getValues('shop.popularSearches') || [];
      form.setValue('shop.popularSearches', [...currentKeywords, newKeyword.trim()], { shouldDirty: true });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const currentKeywords = form.getValues('shop.popularSearches') || [];
    form.setValue('shop.popularSearches', currentKeywords.filter((_, i) => i !== index), { shouldDirty: true });
  };
  
  const popularSearches = form.watch('shop.popularSearches');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Từ khóa tìm kiếm phổ biến</CardTitle>
            <CardDescription>Quản lý các gợi ý từ khóa tìm kiếm hiển thị trên trang cửa hàng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                <Input 
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Ví dụ: Microsoft 365"
                />
                <Button type="button" onClick={handleAddKeyword}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
            </div>
             <div className="mt-4 flex flex-wrap gap-2">
                {popularSearches?.map((keyword, index) => (
                     <Badge key={index} variant="secondary" className="text-sm">
                        {keyword}
                        <button type="button" onClick={() => handleRemoveKeyword(index)} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                           &#x2715;
                        </button>
                    </Badge>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Bộ lọc sản phẩm</CardTitle>
                <CardDescription>Bật hoặc tắt các tùy chọn bộ lọc có sẵn trên thanh bên của cửa hàng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="shop.filters"
                    render={({ field }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(initialData.shop.filters || []).map((filter, index) => (
                                <FormField
                                    key={filter.id}
                                    control={form.control}
                                    name={`shop.filters.${index}.enabled`}
                                    render={({ field: switchField }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                            <FormLabel className="text-sm font-medium">{filter.name}</FormLabel>
                                            <FormControl>
                                                <Switch
                                                    checked={switchField.value}
                                                    onCheckedChange={switchField.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    )}
                />
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Cài đặt trang thanh toán (Checkout)</CardTitle>
                <CardDescription>Tùy chỉnh các tùy chọn hiển thị trên trang thanh toán.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="shop.checkout.showGoogleLogin"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div>
                                 <FormLabel>Hiển thị đăng nhập bằng Google</FormLabel>
                                 <FormDescription className="text-xs">
                                    Cho phép khách hàng đăng nhập nhanh bằng Google ngay tại trang thanh toán.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="shop.checkout.showAppleLogin"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div>
                                <FormLabel>Hiển thị đăng nhập bằng Apple</FormLabel>
                                <FormDescription className="text-xs">
                                    Cho phép khách hàng đăng nhập nhanh bằng Apple ID tại trang thanh toán.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu cài đặt cửa hàng
            </Button>
        </div>
      </form>
    </Form>
  );
}
