

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
import { LoaderCircle, PlusCircle, Trash2 } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig } from '@/lib/types';

const partnerLogoSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  brand: z.string().min(1, 'Mã thương hiệu không được để trống'),
});

const partnersFormSchema = z.object({
  partners: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc'),
    logos: z.array(partnerLogoSchema),
  }),
});

type FormValues = z.infer<typeof partnersFormSchema>;

interface PartnersFormProps {
  initialData: SiteConfig['partners'];
}

export function PartnersForm({ initialData }: PartnersFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(partnersFormSchema),
    defaultValues: {
      partners: {
        title: initialData?.title || 'Đối tác của chúng tôi',
        logos: initialData?.logos || [],
      }
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'partners.logos',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Khu vực đối tác đã được cập nhật.',
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
            <CardTitle>Tiêu đề</CardTitle>
            <CardDescription>
              Tùy chỉnh văn bản hiển thị phía trên danh sách logo đối tác.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="partners.title"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách logo đối tác</CardTitle>
            <CardDescription>
              Thêm hoặc xóa các logo sẽ hiển thị. Mã thương hiệu phải khớp với một logo được định nghĩa sẵn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md bg-secondary/50">
                <FormField
                  control={form.control}
                  name={`partners.logos.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Tên đối tác</FormLabel>
                      <FormControl>
                        <Input placeholder="Microsoft" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`partners.logos.${index}.brand`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Mã thương hiệu (Brand Key)</FormLabel>
                      <FormControl>
                        <Input placeholder="Microsoft" {...field} />
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
              onClick={() => append({ name: '', brand: '' })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm đối tác
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
