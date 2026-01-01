
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
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Save, Send, Eye, Sparkles, Trash2 } from 'lucide-react';
import { sendEmailCampaign, generateEmailCampaignContent } from '../actions';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Discount } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useDebounce } from 'use-debounce';

const campaignSchema = z.object({
  subject: z.string().min(1, 'Tiêu đề là bắt buộc.'),
  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự.'),
  discountCode: z.string().optional(),
  targetAudience: z.enum(['all', 'subscribers', 'customers']).default('all'),
});

type FormValues = z.infer<typeof campaignSchema>;

interface EmailCampaignFormProps {
  discounts: Discount[];
  initialData?: Partial<FormValues>;
}

const LOCAL_STORAGE_KEY = 'email-campaign-draft';

export function EmailCampaignForm({ discounts, initialData }: EmailCampaignFormProps) {
  const { toast } = useToast();
  const [isSending, startSendingTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const form = useForm<FormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      subject: '',
      content: '',
      discountCode: 'none',
      targetAudience: 'all',
      ...initialData,
    },
  });

  const watchedValues = form.watch();
  const [debouncedValues] = useDebounce(watchedValues, 1000); // Debounce for 1 second

  // Load from localStorage on mount, but prioritize initialData from props
  useEffect(() => {
    if (initialData && initialData.subject) {
        form.reset(initialData);
    } else {
        const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDraft) {
        try {
            const parsedDraft = JSON.parse(savedDraft);
            form.reset(parsedDraft);
            toast({ title: "Đã khôi phục bản nháp", description: "Nội dung soạn thảo trước đó đã được tải lại." });
        } catch (error) {
            console.error("Failed to parse email draft from localStorage", error);
        }
        }
    }
  }, [form, toast, initialData]);

  // Save to localStorage on change (debounced)
  useEffect(() => {
      if (form.formState.isDirty) {
          setAutoSaveStatus('saving');
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(debouncedValues));
          const timer = setTimeout(() => setAutoSaveStatus('saved'), 500);
          const idleTimer = setTimeout(() => setAutoSaveStatus('idle'), 2000);
          return () => {
              clearTimeout(timer);
              clearTimeout(idleTimer);
          }
      }
  }, [debouncedValues, form.formState.isDirty]);

  const handleClearDraft = () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      form.reset({
          subject: '',
          content: '',
          discountCode: 'none',
          targetAudience: 'all',
      });
      toast({ title: "Đã xóa bản nháp", description: "Nội dung đã được làm mới." });
  };


  const onSubmit = (data: FormValues) => {
    startSendingTransition(async () => {
      try {
        const finalData = {
          subject: data.subject,
          body: data.content, // Map content to body
          targetAudience: data.targetAudience,
          discountCode: data.discountCode === 'none' ? undefined : data.discountCode,
        };
        
        const result = await sendEmailCampaign(finalData);
        
        toast({
          title: 'Đã gửi chiến dịch!',
          description: `Email đã được gửi đến ${result.count} khách hàng.`,
        });

        // Clear draft and form after successful send
        handleClearDraft();

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể gửi chiến dịch email.',
        });
      }
    });
  };

  const handleGenerateContent = async () => {
    if (!aiTopic) {
        toast({ variant: 'destructive', title: 'Vui lòng nhập chủ đề' });
        return;
    }
    setIsGenerating(true);
    try {
        const selectedDiscountCode = form.getValues('discountCode') === 'none' ? undefined : form.getValues('discountCode');
        const productNamePlaceholder = "Phần mềm bảo mật"; 
        const audience = form.getValues('targetAudience');

        const result = await generateEmailCampaignContent({ 
            productName: productNamePlaceholder,
            discountCode: selectedDiscountCode,
            audience: audience,
        });
        
        // Result is string content
        form.setValue('content', result, { shouldDirty: true });
        
        toast({
            title: 'Đã tạo nội dung!',
            description: 'AI đã điền nội dung vào biểu mẫu. Vui lòng thêm tiêu đề.'
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: error.message || 'Không thể tạo nội dung bằng AI.'
        });
    } finally {
        setIsGenerating(false);
    }
  }

  const isBusy = isSending || isGenerating;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Tạo bằng AI</CardTitle>
                <CardDescription>
                   Nhập chủ đề bạn muốn viết, AI sẽ tự động tạo nội dung email.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <FormLabel>Chủ đề Email (Gợi ý cho AI)</FormLabel>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                        placeholder="Ví dụ: Giới thiệu phần mềm diệt virus mới"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        disabled={isBusy}
                    />
                    <Button onClick={handleGenerateContent} disabled={isBusy || !aiTopic} className="w-full sm:w-auto" type="button">
                        {isGenerating ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Tạo nội dung
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card>
           <CardHeader>
                <div className="flex items-center justify-between">
                     <div>
                        <CardTitle>Soạn thảo chiến dịch</CardTitle>
                        <CardDescription>
                        Điền thông tin chi tiết hoặc chỉnh sửa lại nội dung do AI tạo ra.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground transition-opacity duration-300">
                             {autoSaveStatus === 'saving' && <span className="flex items-center gap-1"><LoaderCircle className="h-3 w-3 animate-spin" /> Đang lưu...</span>}
                            {autoSaveStatus === 'saved' && <span className="text-green-600">Đã lưu bản nháp.</span>}
                        </div>
                        <Button type="button" variant="destructive" size="sm" onClick={handleClearDraft}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa bản nháp
                        </Button>
                    </div>
                </div>
            </CardHeader>
          <CardContent className="pt-6 grid gap-6">
             <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Đối tượng gửi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn đối tượng khách hàng" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="all">Tất cả khách hàng</SelectItem>
                                <SelectItem value="subscribers">Người đăng ký nhận tin</SelectItem>
                                <SelectItem value="customers">Khách hàng đã mua</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tiêu đề Email</FormLabel>
                        <FormControl>
                            <Input placeholder="Ưu đãi đặc biệt chỉ dành cho bạn!" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="discountCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Đính kèm Mã giảm giá (Tùy chọn)</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value || 'none'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn một mã giảm giá để đính kèm" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">Không đính kèm</SelectItem>
                                {discounts.filter(d => d.isActive).map((d) => (
                                    <SelectItem key={d.id} value={d.code}>
                                        {d.code} ({d.type === 'percentage' ? `${d.value}%` : `${d.value} VND`})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung Email</FormLabel>
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" disabled={isBusy}>
                        <Eye className="mr-2 h-4 w-4" />
                        Xem trước
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Xem trước Email</DialogTitle>
                      <DialogDescription className="sr-only">Nội dung email xem trước.</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto p-4 border rounded-md h-full bg-white dark:bg-gray-800 flex-grow">
                        <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: form.getValues('content') }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
            <Button type="submit" disabled={isBusy}>
              {isSending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi chiến dịch
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
