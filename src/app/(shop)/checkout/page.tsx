

'use client';

import { useCartStore } from '@/store/cart';
import { VAT_RATE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/context/auth-context';
import React, { useEffect, useState } from 'react';
import { LoaderCircle, Scan, CreditCard, Wallet, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CartItems } from '@/components/cart-items';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { signUp, signIn, checkIfEmailExists, sendPasswordReset, signInWithGoogle, signInWithApple, getRecaptchaVerifier, signInWithSms } from '@/lib/auth';
import { User, ConfirmationResult } from 'firebase/auth';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { CartItem, SiteConfig } from '@/lib/types';
import { getSiteConfig } from '@/lib/data';
import { placeOrder } from '@/lib/actions';
import { DiscountCodeForm } from '@/components/discount-code-form';


const checkoutFormSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên là bắt buộc.'),
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().optional(),
  paymentMethod: z.enum(['vietqr', 'zalopay', 'creditcard'], {
    required_error: 'Bạn phải chọn một phương thức thanh toán.',
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

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

function CheckoutPageContent({ siteConfig }: { siteConfig: SiteConfig }) {
  const { user, loading: authLoading } = useAuth();
  const { items, cartCount, clearCart, totalPrice, vat, totalWithVat, discountAmount, loyaltyDiscountAmount, appliedDiscount } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const router = useRouter();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      paymentMethod: 'vietqr',
    },
  });
  
  useEffect(() => {
    // This effect ensures the default payment method is set once config loads.
    const pm = siteConfig.paymentMethods;
    const defaultPayment = pm.vietqr.enabled ? 'vietqr' : pm.zalopay.enabled ? 'zalopay' : 'creditcard';
    form.setValue('paymentMethod', defaultPayment);
  }, [siteConfig, form]);


  const subtotal = totalPrice();
  const finalDiscount = discountAmount();
  const vatAmount = vat();
  const finalTotal = totalWithVat();

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);


  useEffect(() => {
    if (user) {
      form.setValue('fullName', user.displayName || '');
      form.setValue('email', user.email || '');
      setIsExistingUser(true);
    }
  }, [user, form]);
  
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe(state => {
      if (state.items.length === 0 && !isLoading) { // Don't redirect if we are in the middle of processing
        toast({
          variant: 'destructive',
          title: 'Giỏ hàng trống!',
          description: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.',
        });
        router.replace('/cart');
      }
    });

    // Initial check
    if (cartCount() === 0) {
       router.replace('/cart');
    }

    return () => unsubscribe();
  }, [cartCount, router, isLoading]);

  const handleEmailBlur = async (email: string) => {
    if (!email || user) return;
    setIsCheckingEmail(true);
    try {
        const exists = await checkIfEmailExists(email);
        setIsExistingUser(exists);
        if (exists) {
            form.setFocus('password');
        } else {
             form.setValue('password', '');
        }
    } catch (error) {
        console.error("Error checking email existence:", error);
    } finally {
        setIsCheckingEmail(false);
    }
  }

  const handleAuthSuccess = () => {
      toast({
        title: 'Thành công',
        description: 'Đăng nhập thành công.',
      });
      router.refresh();
  }

  const handleAuthError = (error: any, provider: string) => {
       toast({
        variant: 'destructive',
        title: `Lỗi đăng nhập qua ${provider}`,
        description: 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
      console.error(`Login error with ${provider}:`, error);
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


  async function onSubmit(data: CheckoutFormValues) {
    setIsLoading(true);
    setCheckoutItems([...items]); // Store cart items before clearing
    let currentUser: User | null = user;

    try {
        if (!currentUser) {
            if (isExistingUser) {
                if (!data.password) {
                    form.setError('password', { type: 'manual', message: 'Mật khẩu là bắt buộc để đăng nhập.' });
                    setIsLoading(false);
                    return;
                }
                try {
                    currentUser = await signIn(data.email, data.password);
                    toast({ title: "Đăng nhập thành công!", description: "Tiếp tục thanh toán..." });
                    router.refresh();
                } catch (error) {
                    toast({ variant: "destructive", title: "Lỗi đăng nhập", description: "Mật khẩu không chính xác. Vui lòng thử lại." });
                    setIsLoading(false);
                    return;
                }
            } else {
                try {
                    currentUser = await signUp(data.email, Math.random().toString(36).slice(-8), data.fullName);
                    toast({
                        title: "Chào mừng bạn!",
                        description: `Một tài khoản đã được tạo cho bạn. Vui lòng kiểm tra email để đặt lại mật khẩu và đăng nhập.`,
                        duration: 8000,
                    });
                    await sendPasswordReset(data.email);
                    router.refresh();
                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        toast({ variant: "destructive", title: "Lỗi", description: "Email này đã được đăng ký. Vui lòng đăng nhập để tiếp tục." });
                        setIsExistingUser(true);
                    } else {
                        toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo tài khoản. Vui lòng thử lại." });
                    }
                    setIsLoading(false);
                    return;
                }
            }
        }
        
        if (!currentUser) {
             toast({ variant: "destructive", title: "Lỗi xác thực", description: "Không thể xác thực người dùng. Vui lòng thử lại." });
             setIsLoading(false);
             return;
        }

        const orderItems = items.map(item => ({
            id: item.id!.split('-')[0], // Get original product ID
            name: item.name,
            quantity: item.quantity,
            price: item.selectedVariant.salePrice || item.selectedVariant.price,
            variantId: item.selectedVariant.id,
            variantName: item.selectedVariant.name,
        }));

        const discountPayload = appliedDiscount ? { 
            id: appliedDiscount.id!, 
            code: appliedDiscount.code,
            value: discountAmount() // Pass the calculated discount amount
        } : undefined;

        const orderId = await placeOrder({
            customer: {
                id: currentUser.uid,
                name: currentUser.displayName || data.fullName,
                email: currentUser.email!,
            },
            items: orderItems,
            subtotal: subtotal,
            vat: vatAmount,
            total: finalTotal,
            paymentMethod: data.paymentMethod,
            discount: discountPayload,
            loyaltyDiscount: loyaltyDiscountAmount(),
        });

        clearCart();
        
        if(data.paymentMethod === 'vietqr' || data.paymentMethod === 'zalopay') {
            router.push(`/order/payment/${orderId}`);
        } else {
             toast({
                title: "Đặt hàng thành công!",
                description: "Cảm ơn bạn đã mua hàng. Một email xác nhận đã được gửi đến bạn."
            });
            router.push('/order/success');
        }


    } catch (error) {
        console.error('Checkout failed:', error);
        toast({
            variant: "destructive",
            title: "Thanh toán thất bại",
            description: "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại."
        });
        setIsLoading(false);
    }
  }


  if (authLoading) {
    return (
        <div className="h-screen flex items-center justify-center">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }
  
  const paymentConfig = siteConfig.paymentMethods;
  const authConfig = siteConfig.authentication;
  const checkoutConfig = siteConfig.shop.checkout;

  const showSocialLogins = !user && authConfig && (
      (authConfig.google.enabled && checkoutConfig.showGoogleLogin) || 
      (authConfig.apple.enabled && checkoutConfig.showAppleLogin)
  );

  return (
    <div className="container mx-auto px-4 py-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
            
            {/* Sidebar on the left for desktop, top for mobile */}
            <div className="w-full space-y-6 md:order-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Tóm tắt đơn hàng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CartItems 
                            view="summary" 
                            showCheckoutButton={false} 
                            initialItems={isLoading ? checkoutItems : items} 
                        />
                        <Separator className="my-4" />
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tạm tính</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {finalDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="text-muted-foreground">Giảm giá</span>
                                    <span>-{formatCurrency(finalDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Phí vận chuyển</span>
                                <span className="text-green-600">Miễn phí</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Thuế GTGT ({VAT_RATE * 100}%)</span>
                                <span>{formatCurrency(vatAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
                  <DiscountCodeForm />
                 <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading || isCheckingEmail}>
                    {(isLoading || isCheckingEmail) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Hoàn tất đơn hàng
                </Button>
            </div>
            
            {/* Main content on the right for desktop, bottom for mobile */}
            <div className="w-full space-y-8 md:order-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin khách hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-6">
                         {showSocialLogins && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                     {authConfig.google.enabled && checkoutConfig.showGoogleLogin && (
                                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                                            <GoogleIcon /> Google
                                        </Button>
                                     )}
                                     {authConfig.apple.enabled && checkoutConfig.showAppleLogin && (
                                         <Button variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={isLoading}>
                                            <AppleIcon /> Apple
                                        </Button>
                                     )}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Hoặc điền thông tin</span>
                                    </div>
                                </div>
                            </div>
                         )}

                         <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Họ và tên</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nguyễn Văn A" {...field} disabled={!!user} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type="email" 
                                            placeholder="nva@example.com" 
                                            {...field} 
                                            onBlur={(e) => handleEmailBlur(e.target.value)}
                                            disabled={!!user || isCheckingEmail}
                                        />
                                        {isCheckingEmail && <LoaderCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                         {isExistingUser && !user && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Mật khẩu</FormLabel>
                                     <FormDescription className="text-xs mb-2">
                                        Email này đã được đăng ký. Vui lòng nhập mật khẩu để đăng nhập và tiếp tục.
                                    </FormDescription>
                                    <FormControl>
                                        <Input type="password" {...field} placeholder="Nhập mật khẩu của bạn" />
                                    </FormControl>
                                    <FormMessage />
                                     <div className="text-sm mt-1">
                                        <Link href="/forgot-password" tabIndex={-1} className="text-muted-foreground hover:text-primary underline">Quên mật khẩu?</Link>
                                    </div>
                                    </FormItem>
                                )}
                            />
                         )}
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Phương thức thanh toán</CardTitle>
                        <CardDescription>Chọn một phương thức để hoàn tất đơn hàng.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                 <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    {paymentConfig.vietqr.enabled && (
                                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                                            <FormControl>
                                            <RadioGroupItem value="vietqr" />
                                            </FormControl>
                                            <FormLabel className="font-normal w-full flex items-center justify-between cursor-pointer">
                                            <span>Chuyển khoản VietQR</span>
                                                <Scan className="h-5 w-5 text-muted-foreground" />
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                    {paymentConfig.zalopay.enabled && (
                                        <FormItem className={cn("flex flex-col space-y-2 rounded-md border p-4", "cursor-not-allowed opacity-50")}>
                                            <div className="flex items-center space-x-3">
                                                <FormControl>
                                                    <RadioGroupItem value="zalopay" disabled />
                                                </FormControl>
                                                <FormLabel className="font-normal w-full flex items-center justify-between">
                                                <span>Ví điện tử ZaloPay</span>
                                                    <Wallet className="h-5 w-5 text-muted-foreground" />
                                                </FormLabel>
                                            </div>
                                             <FormDescription className="pl-7 text-xs">
                                                Tính năng đang được phát triển.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                    {paymentConfig.creditcard.enabled && (
                                        <FormItem className={cn("flex flex-col space-y-2 rounded-md border p-4", "cursor-not-allowed opacity-50")}>
                                            <div className="flex items-center space-x-3">
                                                <FormControl>
                                                    <RadioGroupItem value="creditcard" disabled />
                                                </FormControl>
                                                <FormLabel className="font-normal w-full flex items-center justify-between">
                                                    <span>Thanh toán bằng thẻ tín dụng/ghi nợ</span>
                                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                                </FormLabel>
                                            </div>
                                            <FormDescription className="pl-7 text-xs">
                                            Tính năng đang được phát triển.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                    </CardContent>
                </Card>
            </div>
            </form>
        </Form>
    </div>
  );
}

export default function CheckoutPage() {
    const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
    const { loading: authLoading } = useAuth();
    
    useEffect(() => {
        async function fetchInitialData() {
          const config = await getSiteConfig();
          setSiteConfig(config);
        }
        fetchInitialData();
    }, []);

    if (authLoading || !siteConfig) {
       return (
        <div className="h-screen flex items-center justify-center">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    
    return <CheckoutPageContent siteConfig={siteConfig} />
}
