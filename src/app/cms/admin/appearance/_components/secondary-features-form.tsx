

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
import type { SiteConfig } from '@/lib/types';

const secondaryFeatureSchema = z.object({
  icon: z.string().min(1, 'Tên icon là bắt buộc'),
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  linkText: z.string().min(1, 'Văn bản liên kết là bắt buộc'),
  href: z.string().min(1, 'Đường dẫn là bắt buộc'),
});

const secondaryFeaturesFormSchema = z.object({
  secondaryFeatures: z.array(secondaryFeatureSchema).length(4, "Phải có đúng 4 tính năng."),
});

type FormValues = z.infer<typeof secondaryFeaturesFormSchema>;

interface SecondaryFeaturesFormProps {
  initialData: SiteConfig['secondaryFeatures'];
}

export function SecondaryFeaturesForm({ initialData }: SecondaryFeaturesFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(secondaryFeaturesFormSchema),
    defaultValues: {
      secondaryFeatures: initialData || [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'secondaryFeatures',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Khu vực tính năng phụ đã được cập nhật.',
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
            <CardTitle>Nội dung các ô tính năng</CardTitle>
            <CardDescription>
              Quản lý 4 ô tính năng hiển thị ngay dưới khu vực Hero.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md bg-secondary/50 space-y-4">
                <h4 className="font-semibold">Ô tính năng {index + 1}</h4>
                <FormField
                  control={form.control}
                  name={`secondaryFeatures.${index}.icon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Icon (Lucide)</FormLabel>
                      <FormControl>
                        <Input placeholder="Laptop" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`secondaryFeatures.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề</FormLabel>
                      <FormControl>
                        <Input placeholder="Dành cho cá nhân" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`secondaryFeatures.${index}.linkText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Văn bản liên kết</FormLabel>
                      <FormControl>
                        <Input placeholder="Mua ngay" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`secondaryFeatures.${index}.href`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đường dẫn (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="/products" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
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
