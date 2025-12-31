

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
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { LoaderCircle, Eye, Save, Heart, BellRing, Annoyed, MessageSquare, LineChart, Target } from 'lucide-react';
import { updatePluginSettings } from '../../actions';
import type { SiteConfig, Product, PageContent } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';


const pluginSettingsSchema = z.object({
  plugins: z.object({
    recentViews: z.object({
      enabled: z.boolean(),
      excludedPages: z.string().optional(),
    }),
     wishlist: z.object({
      enabled: z.boolean(),
      excludedPages: z.string().optional(),
    }),
    stockNotifier: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      description: z.string().optional(),
      successMessage: z.string().optional(),
    }),
    promoToast: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      description: z.string().optional(),
      productIds: z.array(z.string()).optional(),
      excludedPages: z.string().optional(),
    }),
    livechat: z.object({
      enabled: z.boolean(),
      script: z.string().optional(),
      excludedPages: z.string().optional(),
    }),
    sgSeo: z.object({
        enabled: z.boolean(),
    }).optional(),
    analytics: z.object({
        enabled: z.boolean(),
        script: z.string().optional(),
        excludedPages: z.string().optional(),
    }).optional(),
  }),
});

type FormValues = z.infer<typeof pluginSettingsSchema>;

interface PluginsFormProps {
  initialData: SiteConfig;
  products: Product[];
  pages: PageContent[];
}


function ExcludedPagesField({ control, name }: { control: any, name: `plugins.${string}.excludedPages` }) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Loại trừ trên các đường dẫn</FormLabel>
                    <FormDescription>
                        Nhập các đường dẫn bạn muốn tắt plugin này, cách nhau bởi dấu phẩy.
                        Ví dụ: /checkout, /cms/admin, /order-history
                    </FormDescription>
                    <FormControl>
                        <Textarea
                            placeholder="/checkout, /cms/admin"
                            {...field}
                            rows={3}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}


export function PluginsForm({ initialData, products, pages }: PluginsFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(pluginSettingsSchema),
    defaultValues: {
        plugins: {
            recentViews: { 
                enabled: initialData.plugins?.recentViews.enabled ?? false,
                excludedPages: initialData.plugins?.recentViews.excludedPages?.join(', ') || '',
            },
            wishlist: { 
                enabled: initialData.plugins?.wishlist.enabled ?? false,
                excludedPages: initialData.plugins?.wishlist.excludedPages?.join(', ') || '',
            },
            stockNotifier: { 
                enabled: initialData.plugins?.stockNotifier.enabled ?? false,
                title: initialData.plugins?.stockNotifier.title || '',
                description: initialData.plugins?.stockNotifier.description || '',
                successMessage: initialData.plugins?.stockNotifier.successMessage || '',
            },
            promoToast: { 
                enabled: initialData.plugins?.promoToast.enabled ?? false,
                title: initialData.plugins?.promoToast.title || '',
                description: initialData.plugins?.promoToast.description || '',
                productIds: initialData.plugins?.promoToast.productIds || [],
                excludedPages: initialData.plugins?.promoToast.excludedPages?.join(', ') || '',
            },
            livechat: {
                enabled: initialData.plugins?.livechat?.enabled ?? false,
                script: initialData.plugins?.livechat?.script || '',
                excludedPages: initialData.plugins?.livechat?.excludedPages?.join(', ') || '',
            },
            sgSeo: {
                enabled: initialData.plugins?.sgSeo?.enabled ?? true,
            },
            analytics: {
                enabled: initialData.plugins?.analytics?.enabled ?? false,
                script: initialData.plugins?.analytics?.script || '',
                excludedPages: initialData.plugins?.analytics?.excludedPages?.join(', ') || '',
            }
        }
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await updatePluginSettings(data);
        toast({
          title: 'Thành công!',
          description: 'Cài đặt plugin đã được cập nhật.',
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

  const activePlugins = [
    { name: 'sgSeo', label: 'SG SEO v.1', icon: Target, description: 'Tối ưu hóa SEO on-page và tự động tạo metadata.', hasPageExclusion: false },
    { name: 'analytics', label: 'Analytics & Tracking', icon: LineChart, description: 'Kích hoạt và nhúng mã script theo dõi (ví dụ: Google Analytics).', hasPageExclusion: true },
    { name: 'recentViews', label: 'Sản phẩm đã xem', icon: Eye, description: 'Hiển thị các sản phẩm người dùng đã xem gần đây.', hasPageExclusion: true },
    { name: 'wishlist', label: 'Danh sách yêu thích', icon: Heart, description: 'Cho phép người dùng lưu lại các sản phẩm yêu thích.', hasPageExclusion: true },
    { name: 'stockNotifier', label: 'Thông báo hàng về', icon: BellRing, description: 'Thông báo cho người dùng khi sản phẩm hết hàng có hàng trở lại.', hasPageExclusion: false },
    { name: 'promoToast', label: 'Thông báo khuyến mãi', icon: Annoyed, description: 'Hiển thị một thông báo nhỏ về sản phẩm nổi bật.', hasPageExclusion: true },
    { name: 'livechat', label: 'Live Chat Script', icon: MessageSquare, description: 'Dán script từ các nhà cung cấp như Tidio, Zendesk, hoặc script tùy chỉnh của bạn.', hasPageExclusion: true },
  ] as const;

  type ExcludablePlugin = 'recentViews' | 'wishlist' | 'promoToast' | 'livechat' | 'analytics';


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card>
            <CardHeader>
                <CardTitle>Quản lý Plugin</CardTitle>
                <CardDescription>
                    Kích hoạt hoặc vô hiệu hóa các plugin và tùy chỉnh nội dung của chúng.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {activePlugins.map((plugin) => (
                     <div key={plugin.name} className="flex flex-col rounded-lg border p-4 gap-4">
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex items-start space-x-4">
                                <plugin.icon className="h-6 w-6 text-muted-foreground mt-1" />
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base font-medium">
                                        {plugin.label}
                                    </FormLabel>
                                    <FormDescription>
                                        {plugin.description}
                                    </FormDescription>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name={`plugins.${plugin.name}.enabled`}
                                render={({ field }) => (
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                )}
                            />
                        </div>
                        
                        {plugin.name === 'stockNotifier' && form.watch('plugins.stockNotifier.enabled') && (
                            <>
                                <Separator />
                                <div className="grid md:grid-cols-2 gap-4 pl-10">
                                    <FormField control={form.control} name="plugins.stockNotifier.title" render={({ field }) => (<FormItem><FormLabel>Tiêu đề Popup</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="plugins.stockNotifier.successMessage" render={({ field }) => (<FormItem><FormLabel>Tin nhắn thành công</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <div className="md:col-span-2">
                                    <FormField control={form.control} name="plugins.stockNotifier.description" render={({ field }) => (<FormItem><FormLabel>Mô tả Popup</FormLabel><FormDescription>Sử dụng %PRODUCT_NAME% và %VARIANT_NAME% để chèn tên sản phẩm/biến thể.</FormDescription><FormControl><Textarea {...field} rows={3} /></FormControl></FormItem>)} />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {plugin.name === 'analytics' && form.watch('plugins.analytics.enabled') && (
                             <>
                                <Separator />
                                <div className="space-y-4 pl-10">
                                    <FormField
                                        control={form.control}
                                        name="plugins.analytics.script"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mã Script</FormLabel>
                                                <FormDescription>Dán toàn bộ mã script analytics của bạn vào đây.</FormDescription>
                                                <FormControl>
                                                    <Textarea placeholder='&lt;!-- Google Tag Manager --&gt; ...' {...field} rows={8} className="font-mono text-xs" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {plugin.name === 'livechat' && form.watch('plugins.livechat.enabled') && (
                             <>
                                <Separator />
                                <div className="space-y-4 pl-10">
                                     <FormField
                                        control={form.control}
                                        name="plugins.livechat.script"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mã Script</FormLabel>
                                                <FormDescription>
                                                    Dán toàn bộ mã script live chat của bạn vào đây. Nó sẽ được chèn vào cuối trang.
                                                </FormDescription>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='<div class="zalo-chat-widget"...></div>'
                                                        {...field}
                                                        rows={8}
                                                        className="font-mono text-xs"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {plugin.name === 'promoToast' && form.watch('plugins.promoToast.enabled') && (
                             <>
                                <Separator />
                                <div className="space-y-4 pl-10">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="plugins.promoToast.title" render={({ field }) => (<FormItem><FormLabel>Tiêu đề Toast</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                        <FormField control={form.control} name="plugins.promoToast.description" render={({ field }) => (<FormItem><FormLabel>Mô tả Toast</FormLabel><FormDescription>Sử dụng %PRODUCT_NAME% để chèn tên sản phẩm.</FormDescription><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    </div>
                                     <FormField
                                        control={form.control}
                                        name="plugins.promoToast.productIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chọn sản phẩm cho chiến dịch</FormLabel>
                                                <FormDescription>
                                                   Các sản phẩm được chọn sẽ hiển thị ngẫu nhiên trong thông báo.
                                                </FormDescription>
                                                <ScrollArea className="h-60 w-full rounded-md border">
                                                    <div className="p-4 space-y-2">
                                                        {products.map((product) => (
                                                            <FormField
                                                                key={product.id}
                                                                control={form.control}
                                                                name="plugins.promoToast.productIds"
                                                                render={({ field }) => {
                                                                    return (
                                                                    <FormItem
                                                                        key={product.id}
                                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                                    >
                                                                        <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(product.id!)}
                                                                            onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), product.id!])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== product.id
                                                                                    )
                                                                                )
                                                                            }}
                                                                        />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal w-full cursor-pointer">
                                                                            <div className="flex items-center gap-2">
                                                                                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="w-10 h-10 object-contain rounded-md border" />
                                                                                <div>
                                                                                    <p className="font-medium">{product.name}</p>
                                                                                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                                                                                </div>
                                                                            </div>
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                    )
                                                                }}
                                                                />
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                            </>
                        )}
                        
                        {plugin.hasPageExclusion && form.watch(`plugins.${plugin.name as ExcludablePlugin}.enabled`) && (
                             <>
                                <Separator />
                                <div className="space-y-4 pl-10">
                                     <ExcludedPagesField control={form.control} name={`plugins.${plugin.name as ExcludablePlugin}.excludedPages`} />
                                </div>
                            </>
                        )}
                    </div>
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
