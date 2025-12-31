
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
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { updateIntegrations } from '../../actions';
import type { SiteConfig } from '@/lib/types';
import { Input } from '@/components/ui/input';


const integrationsSchema = z.object({
  email: z.object({
    postmark: z.object({
        serverToken: z.string().optional(),
        fromEmail: z.string().optional(),
        replyToEmail: z.string().optional(),
    }).optional(),
  }),
});


type FormValues = z.infer<typeof integrationsSchema>;

interface IntegrationsFormProps {
  initialData: SiteConfig;
}

export function EmailSettingsForm({ initialData }: IntegrationsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: {
        email: {
            postmark: {
                serverToken: initialData.email?.postmark?.serverToken || '',
                fromEmail: initialData.email?.postmark?.fromEmail || '',
                replyToEmail: initialData.email?.postmark?.replyToEmail || '',
            },
        },
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateIntegrations({ email: data.email });
        toast({
          title: 'Thành công!',
          description: 'Cài đặt tích hợp đã được cập nhật.',
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>Postmark</CardTitle>
                <CardDescription>Cấu hình gửi email giao dịch qua Postmark.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="email.postmark.serverToken"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Postmark Server Token</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="********-****-****-****-************" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email.postmark.fromEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Gửi Đi (From)</FormLabel>
                        <FormControl>
                            <Input placeholder="no-reply@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email.postmark.replyToEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Phản Hồi (Reply-To)</FormLabel>
                        <FormControl>
                            <Input placeholder="support@yourdomain.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
             <CardFooter>
                 <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                    {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu Cài đặt Email
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
