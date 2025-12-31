

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Save, Phone } from 'lucide-react';
import { updateAuthSettings } from '@/app/cms/admin/actions';
import type { SiteConfig } from '@/lib/types';
import { Switch } from '@/components/ui/switch';


const authSettingsSchema = z.object({
  authentication: z.object({
    google: z.object({
      enabled: z.boolean(),
    }),
    apple: z.object({
      enabled: z.boolean(),
    }),
    sms: z.object({
      enabled: z.boolean(),
    }),
  }),
});

type FormValues = z.infer<typeof authSettingsSchema>;

interface AuthSettingsFormProps {
  initialData: SiteConfig;
}

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.591,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.2,14.53a3.52,3.52,0,0,1-1.53,3,3.67,3.67,0,0,1-2.17.89,2.81,2.81,0,0,1-1.7-.59,2.77,2.77,0,0,1-1.12-1.63H9.27a5.53,5.53,0,0,0,3.31,4.45,5.43,5.43,0,0,0,3.31.5,5.65,5.65,0,0,0,4.13-1.62,5.25,5.25,0,0,0,1.52-4.2A5.1,5.1,0,0,0,19,13.3a4.7,4.7,0,0,0-2.85-1.25,5.16,5.16,0,0,0-2.67.66m.6-1.57a3.42,3.42,0,0,0,1.29-2.58,3.3,3.3,0,0,0-1-2.45,3.12,3.12,0,0,0-2.22-.88,3.54,3.54,0,0,0-2.88,1.4,3,3,0,0,0-1.1,2.3,3.18,3.18,0,0,0,1,2.44,3.22,3.22,0,0,0,2.17.88,3.5,3.5,0,0,0,2.83-1.21M17.3,4.21A6.5,6.5,0,0,0,12.42,2,7,7,0,0,0,5.65,6.38,8.27,8.27,0,0,0,3.5,12.63,8.42,8.42,0,0,0,7.6,19.4a7,7,0,0,0,5.14,2.39,6.7,6.7,0,0,0,4.68-1.66,6.33,6.33,0,0,1-3.92-3,3.48,3.48,0,0,1,1.13-2.6,3.6,3.6,0,0,1,2.47-.94,2.5,2.5,0,0,1,.8,0,5.2,5.2,0,0,1-1.42-3.83,5.27,5.27,0,0,1,1.45-3.56Z"/>
        </svg>
    )
}

export function AuthSettingsForm({ initialData }: AuthSettingsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
        authentication: {
            google: { enabled: initialData.authentication?.google.enabled || false },
            apple: { enabled: initialData.authentication?.apple.enabled || false },
            sms: { enabled: initialData.authentication?.sms.enabled || false },
        }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateAuthSettings(data);
        toast({
          title: 'Thành công!',
          description: 'Cài đặt xác thực đã được cập nhật.',
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

  const authOptions = [
    { name: 'google', label: 'Đăng nhập bằng Google', icon: GoogleIcon, description: 'Cho phép người dùng đăng nhập bằng tài khoản Google của họ.' },
    { name: 'apple', label: 'Đăng nhập bằng Apple', icon: AppleIcon, description: 'Cho phép người dùng đăng nhập bằng Apple ID.' },
    { name: 'sms', label: 'Đăng nhập bằng SMS', icon: Phone, description: 'Cho phép người dùng đăng nhập bằng số điện thoại qua mã OTP.' },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>Quản lý phương thức xác thực</CardTitle>
                <CardDescription>
                    Kích hoạt hoặc vô hiệu hóa các nhà cung cấp dịch vụ xác thực.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {authOptions.map((option) => (
                     <FormField
                        key={option.name}
                        control={form.control}
                        name={`authentication.${option.name}.enabled`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="flex items-start space-x-4">
                                    <option.icon className="h-6 w-6 text-muted-foreground mt-1" />
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-medium">
                                            {option.label}
                                        </FormLabel>
                                        <FormDescription>
                                            {option.description}
                                        </FormDescription>
                                    </div>
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
                ))}
            </CardContent>
             <CardFooter>
                 <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                    {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu thay đổi
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
