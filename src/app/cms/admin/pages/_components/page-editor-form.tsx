

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
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Save, Sparkles, Eye } from 'lucide-react';
import { updatePageContent, generatePageContent as generatePageContentAction, editPageContent, generatePageSeoContent } from '../actions';
import type { PageContent } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

const slugify = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
    const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ·/_,:;";
    const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    str = str.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    return str;
};


const pageContentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc.'),
  slug: z.string().min(1, 'Slug là bắt buộc.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."),
  content: z.string().min(1, 'Nội dung là bắt buộc.'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type FormValues = z.infer<typeof pageContentSchema>;

// Use a version of PageContent where updatedAt is a string
type ClientPageContent = Omit<PageContent, 'updatedAt'> & { updatedAt: string };

interface PageEditorFormProps {
  page: ClientPageContent;
}

export function PageEditorForm({ page }: PageEditorFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, startSavingTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [editInstruction, setEditInstruction] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(pageContentSchema),
    defaultValues: {
      title: page.title || '',
      slug: page.id || '', // The ID is the initial slug
      content: page.content || '',
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
    },
  });

  const titleValue = form.watch('title');
  useEffect(() => {
    // Only auto-slugify if the slug field hasn't been manually dirtied
    if (form.formState.dirtyFields.title && !form.formState.dirtyFields.slug) {
        form.setValue('slug', slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, form]);


  const onSubmit = (data: FormValues) => {
    startSavingTransition(async () => {
      try {
        const { newSlug } = await updatePageContent(page.id, data);
        toast({
          title: 'Thành công!',
          description: `Trang "${data.title}" đã được cập nhật.`,
        });
        
        // If the slug changed, redirect to the new edit page URL
        if (page.id !== newSlug) {
            router.replace(`/cms/admin/pages/${newSlug}`);
        }

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: error.message || 'Không thể cập nhật trang.',
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
        const result = await generatePageContentAction({ topic: aiTopic });
        form.setValue('content', result.htmlContent, { shouldDirty: true });
        form.setValue('title', aiTopic, { shouldDirty: true });
        toast({
            title: 'Đã tạo nội dung!',
            description: 'AI đã điền nội dung HTML vào trình soạn thảo.'
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

  const handleEditContent = async () => {
    const currentContent = form.getValues('content');
    if (!editInstruction) {
        toast({ variant: 'destructive', title: 'Vui lòng nhập yêu cầu chỉnh sửa' });
        return;
    }
    if (!currentContent) {
        toast({ variant: 'destructive', title: 'Không có nội dung để chỉnh sửa' });
        return;
    }
    setIsEditing(true);
    try {
        const result = await editPageContent({
            existingContent: currentContent,
            instruction: editInstruction
        });
        form.setValue('content', result.newHtmlContent, { shouldDirty: true });
        toast({
            title: 'Đã chỉnh sửa nội dung!',
            description: 'AI đã cập nhật nội dung theo yêu cầu của bạn.'
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: error.message || 'Không thể chỉnh sửa nội dung bằng AI.'
        });
    } finally {
        setIsEditing(false);
    }
  }
  
   const handleGenerateSeo = async () => {
    const title = form.getValues('title');
    const content = form.getValues('content');
    if (!title || !content) {
        toast({ variant: 'destructive', title: "Thiếu thông tin", description: "Vui lòng nhập tiêu đề và nội dung cho trang." });
        return;
    }
    setIsGeneratingSeo(true);
    try {
        const result = await generatePageSeoContent({ pageTitle: title, pageContent: content });
        form.setValue('seoTitle', result.seoTitle, { shouldDirty: true });
        form.setValue('seoDescription', result.seoDescription, { shouldDirty: true });
        toast({ title: 'Đã tạo nội dung SEO!', description: 'AI đã tạo và điền vào các trường SEO.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Lỗi', description: error.message || 'Không thể tạo nội dung SEO.' });
    } finally {
        setIsGeneratingSeo(false);
    }
  }

  const isBusy = isSaving || isGenerating || isEditing || isGeneratingSeo;

  return (
     <>
        <Card>
            <CardHeader>
                <CardTitle>Tạo & Chỉnh sửa bằng AI</CardTitle>
                <CardDescription>
                    Tạo nội dung mới từ một chủ đề, hoặc tinh chỉnh nội dung hiện có bằng các yêu cầu bằng văn bản.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label className="text-sm font-medium">Tạo nội dung mới</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Input
                            placeholder="Ví dụ: Chính sách bảo hành phần mềm"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            disabled={isBusy}
                        />
                        <Button onClick={handleGenerateContent} disabled={isBusy || !aiTopic} className="w-full sm:w-auto">
                            {isGenerating ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Tạo mới
                        </Button>
                    </div>
                </div>
                <Separator />
                 <div>
                    <Label className="text-sm font-medium">Tinh chỉnh nội dung hiện tại</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                         <Input
                            placeholder="Ví dụ: Thêm một phần về hỗ trợ kỹ thuật"
                            value={editInstruction}
                            onChange={(e) => setEditInstruction(e.target.value)}
                            disabled={isBusy}
                        />
                        <Button onClick={handleEditContent} disabled={isBusy || !editInstruction} className="w-full sm:w-auto">
                            {isEditing ? (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Tinh chỉnh
                        </Button>
                    </div>
                 </div>
            </CardContent>
        </Card>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
                <CardContent className="pt-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tiêu đề trang</FormLabel>
                                <FormControl>
                                    <Input placeholder="Về chúng tôi" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Slug (URL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ve-chung-toi" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nội dung</FormLabel>
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
            </Card>

             <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Cài đặt SEO</CardTitle>
                        <CardDescription>
                            Tùy chỉnh tiêu đề và mô tả cho công cụ tìm kiếm. Nếu để trống, sẽ sử dụng tiêu đề và nội dung trang.
                        </CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={handleGenerateSeo} disabled={isBusy}>
                        {isGeneratingSeo ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Tạo bằng AI
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tiêu đề SEO</FormLabel>
                            <FormControl>
                                <Input placeholder="Tiêu đề hiển thị trên Google" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mô tả SEO</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Mô tả ngắn gọn (khoảng 160 ký tự) cho trang này." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>


            <CardFooter className="flex justify-end gap-2 px-0">
                <Dialog>
                    <DialogTrigger asChild>
                         <Button type="button" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Xem trước
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>Xem trước: {form.getValues('title')}</DialogTitle>
                            <DialogDescription className="sr-only">Nội dung trang xem trước.</DialogDescription>
                        </DialogHeader>
                         <div className="overflow-y-auto p-4 border rounded-md h-full">
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: form.getValues('content') }}
                            />
                         </div>
                    </DialogContent>
                </Dialog>
                <Button type="submit" disabled={isBusy || !form.formState.isDirty}>
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu thay đổi
                </Button>
            </CardFooter>
        </form>
        </Form>
     </>
  );
}
