

'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
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
import { LoaderCircle, PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig } from '@/lib/types';

const popularCategorySchema = z.object({
  icon: z.string().min(1, 'Icon là bắt buộc'),
  name: z.string().min(1, 'Tên là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc'),
});

const popularCategoriesFormSchema = z.object({
  popularCategories: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc'),
    subtitle: z.string().min(1, 'Phụ đề là bắt buộc'),
    categories: z.array(popularCategorySchema),
  }),
});

type FormValues = z.infer<typeof popularCategoriesFormSchema>;

interface PopularCategoriesFormProps {
  initialData: SiteConfig['popularCategories'];
}

export function PopularCategoriesForm({ initialData }: PopularCategoriesFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(popularCategoriesFormSchema),
    defaultValues: {
      popularCategories: {
        title: initialData?.title || 'Khám phá các danh mục hàng đầu',
        subtitle: initialData?.subtitle || 'Tìm kiếm giải pháp hoàn hảo cho mọi nhu cầu của bạn, từ công việc đến giải trí.',
        categories: initialData?.categories || [],
      }
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'popularCategories.categories',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Khu vực danh mục phổ biến đã được cập nhật.',
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
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="popularCategories.title"
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
              name="popularCategories.subtitle"
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
            <CardTitle>Danh sách các danh mục</CardTitle>
            <CardDescription>
              Quản lý các danh mục sẽ hiển thị trên trang chủ. Tên icon phải là một icon hợp lệ từ thư viện Lucide React.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md bg-secondary/50">
                <div className="flex items-center pt-6">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                </div>
                <FormField
                  control={form.control}
                  name={`popularCategories.categories.${index}.icon`}
                  render={({ field }) => (
                    <FormItem className="flex-grow-[2]">
                      <FormLabel>Tên Icon</FormLabel>
                      <FormControl>
                        <Input placeholder="Paintbrush" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`popularCategories.categories.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-grow-[3]">
                      <FormLabel>Tên hiển thị</FormLabel>
                      <FormControl>
                        <Input placeholder="Thiết kế & Đồ họa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`popularCategories.categories.${index}.slug`}
                  render={({ field }) => (
                    <FormItem className="flex-grow-[3]">
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="thiet-ke-do-hoa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ icon: '', name: '', slug: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm danh mục
            </Button>
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
