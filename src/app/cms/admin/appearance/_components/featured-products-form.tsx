

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig, Product } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const featuredProductsSchema = z.object({
  featuredProducts: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc'),
    subtitle: z.string().min(1, 'Phụ đề là bắt buộc'),
    productIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một sản phẩm nổi bật."),
  }),
});

type FormValues = z.infer<typeof featuredProductsSchema>;

interface FeaturedProductsFormProps {
  initialData: SiteConfig['featuredProducts'];
  products: Product[];
}

export function FeaturedProductsForm({ initialData, products }: FeaturedProductsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(featuredProductsSchema),
    defaultValues: {
      featuredProducts: {
        title: initialData?.title || 'Sản phẩm nổi bật',
        subtitle: initialData?.subtitle || 'Các phần mềm được tin dùng và bán chạy nhất tại Saigonsoft.com.',
        productIds: initialData?.productIds || [],
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Khu vực sản phẩm nổi bật đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: 'Đã có lỗi xảy ra khi cập nhật.',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tiêu đề & Phụ đề</CardTitle>
            <CardDescription>
              Tùy chỉnh văn bản hiển thị phía trên danh sách sản phẩm nổi bật.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="featuredProducts.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featuredProducts.subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phụ đề</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chọn sản phẩm</CardTitle>
            <CardDescription>
              Chọn các sản phẩm bạn muốn hiển thị trong khu vực nổi bật trên trang chủ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="featuredProducts.productIds"
              render={() => (
                <FormItem>
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <div className="p-4 space-y-2">
                         {products.map((product) => (
                            <FormField
                                key={product.id}
                                control={form.control}
                                name="featuredProducts.productIds"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={product.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(product.id!)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), product.id!])
                                            : field.onChange(
                                                field.value?.filter(
                                                    (value) => value !== product.id
                                                )
                                                )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal w-full cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="w-10 h-10 object-contain rounded-md border" />
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{product.brand}</p>
                                            </div>
                                        </div>
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                         ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending || !form.formState.isDirty}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </Button>
      </form>
    </Form>
  );
}
