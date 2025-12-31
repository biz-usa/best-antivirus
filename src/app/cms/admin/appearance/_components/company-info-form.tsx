
'use client';

import { useForm } from 'react-hook-form';
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
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle } from 'lucide-react';
import { updateAppearance } from '../../actions';
import type { SiteConfig } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from './file-uploader';

const companyInfoSchema = z.object({
  companyInfo: z.object({
    name: z.string().min(1, "Tên công ty là bắt buộc"),
    slogan: z.string().default(''),
    email: z.string().email('Email không hợp lệ.').min(1, "Email là bắt buộc"),
    phone: z.string().min(1, "Số điện thoại là bắt buộc"),
    websiteUrl: z.string().url('URL trang web không hợp lệ. Phải bắt đầu bằng http:// hoặc https://').min(1, "URL trang web không được để trống."),
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    taxCode: z.string().optional(),
    logoUrl: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof companyInfoSchema>;

interface CompanyInfoFormProps {
  initialData: SiteConfig['companyInfo'];
}

export function CompanyInfoForm({ initialData }: CompanyInfoFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyInfo: {
        name: initialData.name || '',
        slogan: initialData.slogan || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        websiteUrl: initialData.websiteUrl || '',
        address: initialData.address || '',
        taxCode: initialData.taxCode || '',
        logoUrl: initialData.logoUrl || '',
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAppearance(data);
        toast({
          title: 'Thành công!',
          description: 'Thông tin công ty đã được cập nhật.',
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
            <CardTitle>Thông tin Công ty</CardTitle>
            <FormDescription>
              Thông tin này sẽ được sử dụng trên hóa đơn và các tài liệu khác.
            </FormDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="companyInfo.logoUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Logo trên hóa đơn</FormLabel>
                        <FormDescription>Tải lên logo sẽ hiển thị ở đầu mỗi hóa đơn.</FormDescription>
                        <FormControl>
                            <FileUploader
                                value={field.value || ''}
                                onValueChange={field.onChange}
                                folder="company_assets"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="companyInfo.name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tên công ty</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="companyInfo.taxCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mã số thuế (MST)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
             </div>
            <FormField
              control={form.control}
              name="companyInfo.slogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slogan (khẩu hiệu)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="companyInfo.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="companyInfo.email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="companyInfo.phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="companyInfo.websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL trang web</FormLabel>
                   <FormDescription>Bao gồm cả https://</FormDescription>
                  <FormControl><Input type="url" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending || !form.formState.isDirty}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Lưu thông tin
        </Button>
      </form>
    </Form>
  );
}
