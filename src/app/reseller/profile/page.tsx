

'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, changeUserPassword, linkGoogleAccount, linkAppleAccount } from '@/lib/auth';
import { LoaderCircle, CheckCircle, Link2, KeyRound, Phone, Trophy, ArrowRight, Calendar as CalendarIcon, Building } from 'lucide-react';
import { getUserProfile } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên không được để trống.'),
  address: z.string().min(1, 'Địa chỉ không được để trống.'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  companyAddress: z.string().optional(),
  dateOfBirth: z.date({
      required_error: "Vui lòng chọn ngày sinh.",
      invalid_type_error: "Định dạng ngày không hợp lệ.",
  }).optional().nullable(),
   companyEstablishmentDate: z.date().optional().nullable(),
});


const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp.",
  path: ["confirmPassword"],
});

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" className="mr-2">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.591,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    )
}

function AppleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2 fill-current">
            <path d="M16.2,14.53a3.52,3.52,0,0,1-1.53,3,3.67,3.67,0,0,1-2.17.89,2.81,2.81,0,0,1-1.7-.59,2.77,2.77,0,0,1-1.12-1.63H9.27a5.53,5.53,0,0,0,3.31,4.45,5.43,5.43,0,0,0,3.31.5,5.65,5.65,0,0,0,4.13-1.62,5.25,5.25,0,0,0,1.52-4.2A5.1,5.1,0,0,0,19,13.3a4.7,4.7,0,0,0-2.85-1.25,5.16,5.16,0,0,0-2.67.66m.6-1.57a3.42,3.42,0,0,0,1.29-2.58,3.3,3.3,0,0,0-1-2.45,3.12,3.12,0,0,0-2.22-.88,3.54,3.54,0,0,0-2.88,1.4,3,3,0,0,0-1.1,2.3,3.18,3.18,0,0,0,1,2.44,3.22,3.22,0,0,0,2.17.88,3.5,3.5,0,0,0,2.83-1.21M17.3,4.21A6.5,6.5,0,0,0,12.42,2,7,7,0,0,0,5.65,6.38,8.27,8.27,0,0,0,3.5,12.63,8.42,8.42,0,0,0,7.6,19.4a7,7,0,0,0,5.14,2.39,6.7,6.7,0,0,0,4.68-1.66,6.33,6.33,0,0,1-3.92-3,3.48,3.48,0,0,1,1.13-2.6,3.6,3.6,0,0,1,2.47-.94,2.5,2.5,0,0,1,.8,0,5.2,5.2,0,0,1-1.42-3.83,5.27,5.27,0,0,1,1.45-3.56Z"/>
        </svg>
    )
}

// Helper to safely convert a value to a Date object or null
const toValidDate = (value: any): Date | null => {
    if (!value) return null;
    // Firestore Timestamps have a toDate() method. ISO strings can be parsed.
    const date = value.toDate ? value.toDate() : new Date(value);
    return isNaN(date.getTime()) ? null : date;
};


export default function ResellerProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      address: '',
      companyName: '',
      taxId: '',
      companyAddress: '',
      dateOfBirth: null,
      companyEstablishmentDate: null,
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (userProfile) {
        profileForm.reset({ 
          fullName: userProfile.displayName || '',
          address: userProfile.address || '',
          companyName: userProfile.companyName || '',
          taxId: userProfile.taxId || '',
          companyAddress: userProfile.companyAddress || '',
          dateOfBirth: toValidDate(userProfile.dateOfBirth),
          companyEstablishmentDate: toValidDate(userProfile.companyEstablishmentDate),
        });
    }
  }, [userProfile, profileForm]);


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) return;
    setIsUpdating(true);
    try {
        await updateUserProfile(
          user, 
          values.fullName, 
          values.address, 
          values.companyName, 
          values.taxId, 
          values.companyAddress, 
          values.dateOfBirth, 
          values.companyEstablishmentDate
        );
        toast({
            title: "Thành công",
            description: "Hồ sơ của bạn đã được cập nhật."
        })
        router.refresh();
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Đã có lỗi xảy ra. Vui lòng thử lại."
        })
    } finally {
        setIsUpdating(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!user) return;
    setIsChangingPassword(true);
    try {
        await changeUserPassword(user, values.currentPassword, values.newPassword);
        toast({
            title: "Thành công",
            description: "Mật khẩu của bạn đã được thay đổi."
        });
        passwordForm.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Lỗi đổi mật khẩu",
            description: error.code === 'auth/wrong-password' 
                ? 'Mật khẩu hiện tại không chính xác.'
                : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
        });
    } finally {
        setIsChangingPassword(false);
    }
  }

  const handleLinkGoogle = async () => {
    if (!user) return;
    setLinkingProvider('google');
    try {
      await linkGoogleAccount(user);
      toast({
        title: "Thành công",
        description: "Tài khoản Google của bạn đã được liên kết."
      });
      router.refresh();
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Tài khoản Google này đã được liên kết với một tài khoản khác."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể liên kết tài khoản Google. Vui lòng thử lại."
        });
      }
    } finally {
      setLinkingProvider(null);
    }
  }
  
  const handleLinkApple = async () => {
    if (!user) return;
    setLinkingProvider('apple');
    try {
      await linkAppleAccount(user);
      toast({
        title: "Thành công",
        description: "Tài khoản Apple của bạn đã được liên kết."
      });
      router.refresh();
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Tài khoản Apple này đã được liên kết với một tài khoản khác."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể liên kết tài khoản Apple. Vui lòng thử lại."
        });
      }
    } finally {
      setLinkingProvider(null);
    }
  };

  // While loading or if there's no user (and redirect is pending), show nothing or a spinner
  if (loading || !user) {
    return null; 
  }

  const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');
  const hasGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
  const hasAppleProvider = user.providerData.some(p => p.providerId === 'apple.com');
  const hasPhoneProvider = user.providerData.some(p => p.providerId === 'phone');

  return (
     <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Hồ sơ Reseller</h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý thông tin tài khoản, công ty và bảo mật của bạn.
        </p>
      </header>
      
        <Card>
        <CardHeader>
            <CardTitle>Thông tin cá nhân & Công ty</CardTitle>
            <CardDescription>Cập nhật thông tin cá nhân và công ty (nếu có) để xuất hóa đơn.</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user.email || ''} disabled />
                        </div>
                         <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Họ và tên</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={profileForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Ngày sinh</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP", { locale: vi }) : <span>Chọn ngày sinh</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            locale={vi}
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            fromYear={1920}
                                            toYear={new Date().getFullYear()}
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Địa chỉ cá nhân</FormLabel>
                            <FormControl>
                                <Textarea placeholder="123 Đường ABC, Phường X, Quận Y, TP. Z" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={profileForm.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tên công ty (tùy chọn)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Công ty TNHH XYZ" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                         <FormField
                            control={profileForm.control}
                            name="taxId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mã số thuế (tùy chọn)</FormLabel>
                                <FormControl>
                                    <Input placeholder="0312345678" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={profileForm.control}
                        name="companyAddress"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Địa chỉ công ty (tùy chọn)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. HCM" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                     <FormField
                        control={profileForm.control}
                        name="companyEstablishmentDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Ngày thành lập công ty (tùy chọn)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            locale={vi}
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            fromYear={1950}
                                            toYear={new Date().getFullYear()}
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isUpdating || !profileForm.formState.isDirty}>
                         {isUpdating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Cập nhật hồ sơ
                    </Button>
                </form>
            </Form>
        </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Đối tác Thân thiết</CardTitle>
                <CardDescription>Xem hạng và điểm tích lũy của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hạng hiện tại</p>
                        <p className="text-xl font-bold flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            {userProfile?.loyaltyTier || 'Chưa xếp hạng'}
                        </p>
                    </div>
                     <div className="text-right space-y-1">
                        <p className="text-sm text-muted-foreground">Điểm tích lũy</p>
                        <p className="text-xl font-bold">{userProfile?.loyaltyPoints?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/reseller/loyalty">
                        Xem chi tiết chương trình
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Bảo mật & Đăng nhập</CardTitle>
                <CardDescription>Quản lý mật khẩu và các phương thức đăng nhập đã liên kết.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-medium flex items-center"><Link2 className="mr-2 h-4 w-4 text-muted-foreground" />Các tài khoản đã liên kết</h3>
                    
                    {/* Google Provider */}
                    <div className="flex items-center justify-between rounded-md border bg-secondary/50 p-3">
                        <div className="flex items-center gap-3">
                            <GoogleIcon />
                            <span className="font-medium text-sm">Google</span>
                        </div>
                        {hasGoogleProvider ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Đã liên kết</span>
                            </div>
                        ) : (
                             <Button onClick={handleLinkGoogle} disabled={!!linkingProvider}>
                                {linkingProvider === 'google' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Liên kết ngay
                            </Button>
                        )}
                    </div>

                    {/* Apple Provider */}
                    <div className="flex items-center justify-between rounded-md border bg-secondary/50 p-3">
                        <div className="flex items-center gap-3">
                            <AppleIcon />
                            <span className="font-medium text-sm">Apple</span>
                        </div>
                         {hasAppleProvider ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Đã liên kết</span>
                            </div>
                        ) : (
                             <Button onClick={handleLinkApple} disabled={!!linkingProvider}>
                                {linkingProvider === 'apple' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Liên kết ngay
                            </Button>
                        )}
                    </div>

                    {/* Phone/SMS Provider */}
                     <div className="flex items-center justify-between rounded-md border bg-secondary/50 p-3">
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 mx-0.5" />
                            <span className="font-medium text-sm">Số điện thoại</span>
                        </div>
                         {hasPhoneProvider ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>{user.phoneNumber}</span>
                            </div>
                        ) : (
                             <Button disabled>
                                Liên kết (sắp có)
                            </Button>
                        )}
                    </div>
                </div>

                {hasPasswordProvider && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                           <h3 className="font-medium flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />Đổi mật khẩu</h3>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                     <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <div className="flex items-center">
                                                <FormLabel>Mật khẩu hiện tại</FormLabel>
                                                <Link href="/forgot-password" className="ml-auto inline-block text-xs underline">
                                                Quên mật khẩu?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Mật khẩu mới</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                        Đổi mật khẩu
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
