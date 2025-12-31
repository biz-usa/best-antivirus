

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
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { AdminUser, Permission } from '@/lib/types';
import { addModerator, updateModerator } from '@/app/cms/admin/actions';
import { Separator } from '@/components/ui/separator';

const permissionOptions: { id: Permission; label: string, description: string }[] = [
    { id: 'manage_products', label: 'Sản phẩm', description: 'Thêm, sửa, xóa sản phẩm.' },
    { id: 'manage_orders', label: 'Đơn hàng', description: 'Xem và cập nhật trạng thái đơn hàng.' },
    { id: 'manage_discounts', label: 'Mã giảm giá', description: 'Quản lý mã giảm giá.' },
    { id: 'manage_digital_assets', label: 'Tài nguyên số', description: 'Quản lý license keys và link tải về.' },
    { id: 'manage_customers', label: 'Khách hàng', description: 'Xem thông tin và lịch sử khách hàng.' },
    { id: 'manage_loyalty_program', label: 'Khách hàng Thân thiết', description: 'Cấu hình tỉ lệ tích điểm và các hạng thành viên.' },
    { id: 'manage_pages', label: 'Trang nội dung', description: 'Sửa nội dung các trang tĩnh.' },
    { id: 'manage_categories', label: 'Danh mục', description: 'Quản lý danh mục sản phẩm.' },
    { id: 'manage_brands', label: 'Thương hiệu', description: 'Quản lý thương hiệu sản phẩm.' },
    { id: 'manage_email_campaigns', label: 'Email Marketing', description: 'Soạn và gửi chiến dịch email.' },
    { id: 'manage_plugins', label: 'Plugins & Add-ons', description: 'Kích hoạt và cấu hình plugins.' },
    { id: 'manage_appearance', label: 'Giao diện', description: 'Thay đổi logo, màu sắc, bố cục trang chủ.' },
    { id: 'manage_product_feeds', label: 'Xuất dữ liệu', description: 'Xuất dữ liệu sản phẩm ra file.' },
    { id: 'manage_authentication', label: 'Xác thực', description: 'Quản lý các phương thức đăng nhập.' },
    { id: 'manage_payments', label: 'Cổng thanh toán', description: 'Quản lý các cổng thanh toán.' },
    { id: 'manage_integrations', label: 'Tích hợp & API', description: 'Quản lý các API keys.' },
    { id: 'manage_tax_settings', label: 'Cài đặt Thuế', description: 'Quản lý các quy tắc thuế.' },
    { id: 'manage_moderators', label: 'Quản trị viên', description: 'Thêm, sửa, xóa các quản trị viên khác.' },
].sort((a,b) => a.label.localeCompare(b.label));

const moderatorSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  role: z.enum(['superadmin', 'moderator']),
  permissions: z.array(z.string()),
});

type FormValues = z.infer<typeof moderatorSchema>;

interface ModeratorFormProps {
    initialData?: AdminUser | null;
}

export function ModeratorForm({ initialData }: ModeratorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(moderatorSchema),
    defaultValues: initialData || {
      email: '',
      role: 'moderator',
      permissions: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        await updateModerator(initialData.id!, data);
         toast({
            title: 'Thành công!',
            description: 'Quyền của quản trị viên đã được cập nhật.',
        });
      } else {
        await addModerator(data);
        toast({
            title: 'Thành công!',
            description: 'Quản trị viên đã được thêm thành công.',
        });
      }
      router.push('/cms/admin/moderators');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Đã có lỗi xảy ra',
        description: error.message || `Không thể ${initialData ? 'cập nhật' : 'tạo'} quản trị viên.`,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const action = initialData ? "Lưu thay đổi" : "Thêm quản trị viên";

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Thông tin người dùng</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder="moderator@example.com" {...field} disabled={!!initialData} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Vai trò</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={initialData?.role === 'superadmin'}>
                                <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>Super Admin có tất cả quyền hạn.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quyền hạn</CardTitle>
                    <CardDescription>
                        Chọn các quyền hạn cụ thể cho vai trò Moderator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="permissions"
                        render={() => (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {permissionOptions.map((item) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="permissions"
                                render={({ field }) => {
                                    const isDisabled = form.getValues('role') === 'superadmin';
                                    const isChecked = isDisabled || field.value?.includes(item.id);
                                    return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...field.value, item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                                (value) => value !== item.id
                                                            )
                                                            )
                                                    }}
                                                    disabled={isDisabled}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="cursor-pointer">{item.label}</FormLabel>
                                                <FormDescription>{item.description}</FormDescription>
                                            </div>
                                        </FormItem>
                                    )
                                }}
                                />
                            ))}
                            </div>
                        )}
                        />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
                        {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {action}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
  );
}

    