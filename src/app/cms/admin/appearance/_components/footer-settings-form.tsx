

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
import { LoaderCircle, PlusCircle, Trash2 } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const navLinkSchema = z.object({
  text: z.string().min(1, 'Link text is required'),
  href: z.string().min(1, 'Link URL is required'),
});

const columnSchema = z.object({
  title: z.string().min(1, 'Column title is required'),
  links: z.array(navLinkSchema),
  authRequired: z.boolean().default(false),
});

const footerSettingsSchema = z.object({
  footer: z.object({
    linkColumns: z.array(columnSchema),
  }),
});

type FormValues = z.infer<typeof footerSettingsSchema>;

interface FooterSettingsFormProps {
  initialData: SiteConfig['footer'];
}

export function FooterSettingsForm({ initialData }: FooterSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(footerSettingsSchema),
    defaultValues: {
      footer: {
        linkColumns: initialData?.linkColumns || [],
      }
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'footer.linkColumns',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Cài đặt chân trang đã được cập nhật.',
        });
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
            <CardTitle>Cột liên kết ở chân trang</CardTitle>
            <CardDescription>
              Quản lý các cột và liên kết hiển thị ở cuối trang web.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md bg-secondary/50 space-y-4">
                <div className="flex justify-between items-center">
                  <FormField
                    control={form.control}
                    name={`footer.linkColumns.${index}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Tiêu đề cột {index + 1}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ví dụ: Sản phẩm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="ml-4 mt-6">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                 <FormField
                    control={form.control}
                    name={`footer.linkColumns.${index}.authRequired`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                         <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                Yêu cầu đăng nhập
                            </FormLabel>
                            <FormDescription>
                                Nếu được chọn, cột này sẽ chỉ hiển thị cho người dùng đã đăng nhập.
                            </FormDescription>
                        </div>
                        </FormItem>
                    )}
                    />

                <Separator />
                
                <LinksArray index={index} control={form.control} />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: '', links: [], authRequired: false })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm cột mới
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

function LinksArray({ index, control }: { index: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `footer.linkColumns.${index}.links`
  });

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">Các liên kết trong cột</h4>
      {fields.map((linkField, linkIndex) => (
        <div key={linkField.id} className="flex items-end gap-2">
          <FormField
            control={control}
            name={`footer.linkColumns.${index}.links.${linkIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="text-xs">Văn bản</FormLabel>
                <FormControl><Input {...field} placeholder="Bảo mật" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`footer.linkColumns.${index}.links.${linkIndex}.href`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel className="text-xs">Đường dẫn (URL)</FormLabel>
                <FormControl><Input {...field} placeholder="/category/bao-mat" /></FormControl>
              </FormItem>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(linkIndex)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary"
        onClick={() => append({ text: '', href: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Thêm liên kết
      </Button>
    </div>
  );
}
