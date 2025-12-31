

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { updateUserInfo } from '@/app/cms/admin/actions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  displayName: z.string().min(1, 'Họ và tên là bắt buộc.'),
  address: z.string().min(1, 'Địa chỉ không được để trống.'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  companyAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerInfoFormProps {
  profile: UserProfile;
}

export function CustomerInfoForm({ profile }: CustomerInfoFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: profile.displayName || '',
      address: profile.address || '',
      companyName: profile.companyName || '',
      taxId: profile.taxId || '',
      companyAddress: profile.companyAddress || '',
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateUserInfo(profile.uid, data);
        toast({
          title: 'Thành công!',
          description: 'Thông tin khách hàng đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể cập nhật thông tin.',
        });
      }
    });
  };
  
  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Thông tin liên hệ & Công ty</CardTitle>
            <CardDescription>Chỉnh sửa thông tin cá nhân và thông tin xuất hóa đơn của khách hàng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tên khách hàng</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div>
                    <FormLabel>Email</FormLabel>
                    <Input value={profile.email} disabled className="mt-2" />
                </div>
            </div>
            <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Địa chỉ cá nhân</FormLabel>
                    <FormControl>
                        <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tên công ty (tùy chọn)</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mã số thuế (tùy chọn)</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Địa chỉ công ty (tùy chọn)</FormLabel>
                    <FormControl>
                        <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Lưu thông tin
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    