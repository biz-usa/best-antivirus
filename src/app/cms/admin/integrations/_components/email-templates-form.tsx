
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
import { updateEmailTemplates } from '../../actions'; // Use correct action
import type { SiteConfig } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const emailTemplateSchema = z.object({
    subject: z.string().min(1, "Chủ đề không được để trống."),
    body: z.string().min(1, "Nội dung không được để trống."),
});

const formSchema = z.object({
    emailTemplates: z.object({
        orderConfirmation: emailTemplateSchema,
        orderStatusUpdate: emailTemplateSchema,
        passwordChanged: emailTemplateSchema,
        backInStock: emailTemplateSchema,
        welcomeAndSetPassword: emailTemplateSchema,
        forgotPassword: emailTemplateSchema,
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface EmailTemplatesFormProps {
  initialData: SiteConfig;
}

export function EmailTemplatesForm({ initialData }: EmailTemplatesFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        emailTemplates: initialData.emailTemplates
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updateEmailTemplates({ emailTemplates: data.emailTemplates });
        toast({
          title: 'Thành công!',
          description: 'Các mẫu email đã được cập nhật.',
        });
        form.reset(data, { keepDirtyValues: true });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể cập nhật các mẫu email.',
        });
      }
    });
  };
  
  const templateFields = [
      { name: 'orderConfirmation', title: 'Xác nhận đơn hàng' },
      { name: 'orderStatusUpdate', title: 'Cập nhật trạng thái đơn hàng' },
      { name: 'welcomeAndSetPassword', title: 'Chào mừng & Đặt mật khẩu' },
      { name: 'forgotPassword', title: 'Yêu cầu Quên mật khẩu' },
      { name: 'passwordChanged', title: 'Thông báo đổi mật khẩu' },
      { name: 'backInStock', title: 'Thông báo hàng về' },
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa các mẫu Email</CardTitle>
            <CardDescription>
                Tùy chỉnh nội dung của các email tự động được gửi đến khách hàng.
                Bạn có thể sử dụng các biến như `{"{{customer_name}}"}` hoặc `{"{{order_id}}"}` để chèn dữ liệu động.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {templateFields.map(template => (
                     <AccordionItem value={template.name} key={template.name}>
                        <AccordionTrigger>{template.title}</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name={`emailTemplates.${template.name}.subject`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chủ đề Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`emailTemplates.${template.name}.body`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nội dung Email (HTML)</FormLabel>
                                        <FormControl>
                                             <RichTextEditor
                                                content={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
          </CardContent>
           <CardFooter>
                 <Button type="submit" disabled={isPending || !form.formState.isDirty}>
                    {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu các mẫu
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
