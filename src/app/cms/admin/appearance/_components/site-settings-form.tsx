

'use client';

import { useForm } from 'react-hook-form';
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
import type { SiteConfig } from '@/lib/types';
import { FileUploader } from './file-uploader';

const siteSettingsSchema = z.object({
  theme: z.object({
    fontFamily: z.string().optional(),
  }),
  header: z.object({
    logoLightUrl: z.string().url('URL logo không hợp lệ.').or(z.literal('')),
    logoDarkUrl: z.string().url('URL logo không hợp lệ.').or(z.literal('')),
  }),
});

type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

interface SiteSettingsFormProps {
  initialData: {
    theme: SiteConfig['theme'];
    header: SiteConfig['header'];
  };
}

export function SiteSettingsForm({ initialData }: SiteSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      theme: {
        fontFamily: initialData.theme?.fontFamily || '',
      },
      header: {
        logoLightUrl:
          initialData.header?.logoLightUrl ||
          '',
        logoDarkUrl:
          initialData.header?.logoDarkUrl ||
          '',
      },
    },
  });

  const onSubmit = (data: SiteSettingsFormValues) => {
    startTransition(async () => {
      try {
        const fontName = data.theme.fontFamily?.trim();
        if (fontName && !/^[a-zA-Z\s]+$/.test(fontName)) {
          toast({
            variant: 'destructive',
            title: 'Tên font không hợp lệ!',
            description: 'Vui lòng chỉ sử dụng chữ cái và khoảng trắng.',
          });
          return;
        }

        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Cài đặt giao diện chung đã được cập nhật.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Đã có lỗi xảy ra khi cập nhật cài đặt.',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Tải lên logo cho giao diện sáng và tối.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="header.logoLightUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo cho giao diện sáng (Light mode)</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onValueChange={field.onChange}
                      folder="site_assets"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="header.logoDarkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo cho giao diện tối (Dark mode)</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onValueChange={field.onChange}
                      folder="site_assets"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt Font chữ</CardTitle>
            <CardDescription>
              Chọn một font chữ từ Google Fonts để áp dụng cho toàn bộ trang
              web.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="theme.fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Google Font</FormLabel>
                  <FormControl>
                    <Input placeholder="Inter" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nhập chính xác tên font như trên trang Google Fonts (ví dụ:
                    Roboto, Open Sans, Lato). Nếu để trống, font mặc định của trình duyệt sẽ được sử dụng.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          Lưu thay đổi
        </Button>
      </form>
    </Form>
  );
}
