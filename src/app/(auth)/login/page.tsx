

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
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
import { useRouter } from 'next/navigation';
import { signIn, signInWithGoogle, getRecaptchaVerifier, signInWithSms, signInWithApple } from '@/lib/auth';
import { LoaderCircle, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { getSiteConfig } from '@/lib/data';
import type { SiteConfig } from '@/lib/types';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Mật khẩu không được để trống.'),
});

const smsFormSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Số điện thoại không hợp lệ.'),
});

const otpFormSchema = z.object({
  otp: z.string().length(6, 'Mã OTP phải có 6 chữ số.'),
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

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<SiteConfig['authentication'] | null>(null);
  const [view, setView] = useState<'email' | 'sms' | 'otp'>('email');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [appVerifier, setAppVerifier] = useState<RecaptchaVerifier | null>(null);

  const emailForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const smsForm = useForm<z.infer<typeof smsFormSchema>>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: { phone: '' },
  });

   const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    async function fetchConfig() {
      const config = await getSiteConfig();
      setAuthConfig(config.authentication || null);
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    // This effect runs only on the client side, ensuring 'window' is available.
    try {
        const verifier = getRecaptchaVerifier('recaptcha-container');
        setAppVerifier(verifier);
    } catch(error) {
        console.error("Failed to initialize reCAPTCHA verifier", error);
        toast({
            variant: "destructive",
            title: "Lỗi reCAPTCHA",
            description: "Không thể khởi tạo reCAPTCHA. Vui lòng tải lại trang."
        })
    }
  }, []);
  
  const handleAuthSuccess = () => {
      toast({
        title: 'Thành công',
        description: 'Đăng nhập thành công.',
      });
      router.refresh(); // Refresh to update auth state in layout
  }

  const handleAuthError = (error: any, provider: string) => {
       toast({
        variant: 'destructive',
        title: `Lỗi đăng nhập qua ${provider}`,
        description: 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
      console.error(`Login error with ${provider}:`, error);
  }

  async function onEmailSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
      handleAuthSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đăng nhập',
        description: 'Email hoặc mật khẩu không chính xác.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
      setIsLoading(true);
      try {
          await signInWithGoogle();
          handleAuthSuccess();
      } catch (error) {
          handleAuthError(error, 'Google');
      } finally {
          setIsLoading(false);
      }
  }
  
    const handleAppleSignIn = async () => {
      setIsLoading(true);
      try {
          await signInWithApple();
          handleAuthSuccess();
      } catch (error) {
          handleAuthError(error, 'Apple');
      } finally {
          setIsLoading(false);
      }
  }

  async function onSmsSubmit(values: z.infer<typeof smsFormSchema>) {
    if (!appVerifier) {
      toast({ variant: 'destructive', title: "Lỗi", description: "Trình xác thực reCAPTCHA chưa sẵn sàng." });
      return;
    }
    setIsLoading(true);
    try {
      const confirmation = await signInWithSms(values.phone, appVerifier);
      setConfirmationResult(confirmation);
      setView('otp');
      toast({ title: "Đã gửi OTP", description: `Mã OTP đã được gửi đến số ${values.phone}`});
    } catch (error) {
        handleAuthError(error, 'SMS');
    } finally {
        setIsLoading(false);
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpFormSchema>) {
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
        await confirmationResult.confirm(values.otp);
        handleAuthSuccess();
    } catch (error) {
        toast({ variant: 'destructive', title: "Lỗi", description: "Mã OTP không hợp lệ."});
    } finally {
        setIsLoading(false);
    }
  }


  const renderEmailView = () => (
     <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="grid gap-4">
            <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={emailForm.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <div className="flex items-center">
                    <FormLabel>Mật khẩu</FormLabel>
                    <Link href="/forgot-password"
                    className="ml-auto inline-block text-xs underline"
                    >
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
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
            </Button>
        </form>
    </Form>
  )

  const renderSmsView = () => (
     <Form {...smsForm}>
        <form onSubmit={smsForm.handleSubmit(onSmsSubmit)} className="grid gap-4">
             <FormField
                control={smsForm.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                        <Input placeholder="+84901234567" {...field} />
                    </FormControl>
                     <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !appVerifier}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Gửi mã OTP
            </Button>
        </form>
     </Form>
  )

    const renderOtpView = () => (
     <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="grid gap-4">
             <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mã xác thực OTP</FormLabel>
                    <FormControl>
                        <Input placeholder="123456" {...field} />
                    </FormControl>
                     <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận & Đăng nhập
            </Button>
             <Button variant="link" size="sm" onClick={() => setView('sms')} className="text-xs">
                Gửi lại mã?
            </Button>
        </form>
     </Form>
    )


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
            {view === 'email' && 'Nhập email của bạn dưới đây để đăng nhập vào tài khoản của bạn.'}
            {view === 'sms' && 'Nhập số điện thoại của bạn để nhận mã OTP.'}
            {view === 'otp' && 'Nhập mã OTP gồm 6 chữ số đã được gửi đến điện thoại của bạn.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {view === 'email' && renderEmailView()}
        {view === 'sms' && renderSmsView()}
        {view === 'otp' && renderOtpView()}
        
        {(authConfig?.google?.enabled || authConfig?.sms?.enabled || authConfig?.apple.enabled) && (
            <>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {authConfig?.google?.enabled && view === 'email' && (
                         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                            <GoogleIcon />
                            Google
                        </Button>
                    )}
                    {authConfig?.apple?.enabled && view === 'email' && (
                         <Button variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={isLoading}>
                            <AppleIcon />
                            Apple
                        </Button>
                    )}
                    {authConfig?.sms?.enabled && view === 'email' && (
                        <Button variant="outline" className="w-full" onClick={() => setView('sms')} disabled={isLoading}>
                            <Phone className="mr-2 h-4 w-4" />
                            Số điện thoại (SMS)
                        </Button>
                    )}
                     {view !== 'email' && (
                        <Button variant="outline" className="w-full" onClick={() => setView('email')} disabled={isLoading}>
                            Email & Mật khẩu
                        </Button>
                     )}
                </div>
            </>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-center text-sm w-full">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="underline">
            Đăng ký
          </Link>
        </div>
      </CardFooter>
      <div id="recaptcha-container"></div>
    </Card>
  );
}
