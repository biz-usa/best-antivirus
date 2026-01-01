

import { Timestamp } from "firebase/firestore";

export type Permission = 
  | 'manage_products'
  | 'manage_orders'
  | 'manage_discounts'
  | 'manage_digital_assets'
  | 'manage_customers'
  | 'manage_pages'
  | 'manage_categories'
  | 'manage_brands'
  | 'manage_email_campaigns'
  | 'manage_plugins'
  | 'manage_appearance'
  | 'manage_product_feeds'
  | 'manage_authentication'
  | 'manage_payments'
  | 'manage_integrations'
  | 'manage_tax_settings' // Added permission
  | 'manage_moderators'
  | 'manage_loyalty_program';

export interface AdminUser {
    id?: string;
    uid?: string;
    email: string;
    role: 'superadmin' | 'moderator';
    permissions: Permission[];
    createdAt: Timestamp;
}

export interface Review {
  rating: number; // 1-5
  pros: string[];
  cons: string[];
}

export interface UsedLicenseKey {
    key: string;
    orderId: string;
    customerId: string;
    assignedAt: Timestamp | Date;
}

export interface VariantAttribute {
  name: string; // e.g., "Hệ điều hành", "Số thiết bị"
  value: string; // e.g., "Windows", "1 PC"
}

export interface ProductVariant {
  id: string; // e.g., "win-1pc"
  name: string; // e.g., "Windows / 1 PC"
  price: number;
  salePrice?: number;
  resellerPrice?: number;
  saleStartDate?: Timestamp | Date;
  saleEndDate?: Timestamp | Date;
  sku: string;
  attributes: VariantAttribute[];
  downloadUrl?: string;
  licenseKeys?: {
    available: string[];
    used: UsedLicenseKey[];
  };
}


export interface Product {
  id?: string; // Made optional for new products
  slug: string;
  name: string;
  brand: string;
  mfr: string;
  category: {
    name:string;
    slug: string;
  };
  status: 'active' | 'hidden';
  licenseType: 'Subscription' | 'Perpetual';
  shortDescription: string;
  longDescription: string;
  currency: 'VND';
  imageUrl: string;
  imageHint: string;
  screenshots: string[];
  reviews: Review[];
  
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;

  // Variants replace top-level price/sku
  variants: ProductVariant[];

  // Guide is now at the product level
  guide?: string;
  createdAt?: Timestamp;
}

export interface Category {
  id: string; // This will be the slug
  name: string;
  slug: string;
  icon?: string;
}

export interface Brand {
  id: string;
  name: string;
  icon?: string;
}

export interface OrderItem {
  id: string; // This is the product ID
  name: string;
  quantity: number;
  price: number;
  variantId: string; // To identify the specific variant purchased
  variantName: string;
}

export interface CustomerInfo {
    id?: string; // User UID from Firebase Auth, optional for guests
    name: string;
    email: string;
}

export interface Order {
    id: string;
    customer: CustomerInfo;
    items: OrderItem[];
    subtotal: number;
    vat: number;
    total: number;
    status: 'Chờ thanh toán' | 'Đang xử lý' | 'Hoàn thành' | 'Đã hủy';
    paymentMethod: string;
    paymentData?: { [key: string]: any };
    createdAt: Timestamp;
    discount?: {
        id: string;
        code: string;
        value: number;
    };
    loyaltyDiscount?: number;
}

export type LoyaltyTier = 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương' | 'Chưa xếp hạng';

export interface LoyaltyTierDetails {
  name: LoyaltyTier;
  minPoints: number;
  discountPercentage: number;
  benefits: string[];
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    address: string;
    role: 'customer' | 'reseller';
    status: 'active' | 'trashed';
    createdAt?: Timestamp | Date;
    dateOfBirth?: Timestamp | Date | null;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    companyEstablishmentDate?: Timestamp | Date | null;
    loyaltyTier?: LoyaltyTier;
    loyaltyPoints?: number;
}

export interface Customer {
    uid: string;
    name: string;
    email: string;
    role: 'customer' | 'reseller';
    totalSpent: number;
    totalOrders: number;
    address?: string;
    loyaltyTier?: LoyaltyTier;
    loyaltyPoints?: number;
    status: 'active' | 'trashed';
}

export interface DailyRevenue {
    date: string;
    revenue: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface NavLink {
    text: string;
    href: string;
}

export interface FooterLinkColumn {
    title: string;
    links: NavLink[];
    authRequired?: boolean;
}

export interface ShopFilter {
    id: 'categories' | 'brands' | 'licenseTypes' | 'priceRange' | 'attributes' | 'onSale' | 'inStock' | 'newArrivals';
    name: string;
    enabled: boolean;
}

export interface ShopSettings {
    popularSearches: string[];
    filters: ShopFilter[];
    checkout: {
        showGoogleLogin: boolean;
        showAppleLogin: boolean;
    };
}

export interface SecondaryFeature {
    icon: string;
    title: string;
    linkText: string;
    href: string;
}

export interface PopularCategory {
    icon: string;
    name: string;
    slug: string;
}

export interface PartnerLogo {
    name: string;
    brand: string;
}

export interface EmailTemplate {
    subject: string;
    body: string;
}

export interface PluginSettings {
    recentViews: { 
        enabled: boolean; 
        excludedPages?: string[];
    };
    wishlist: { 
        enabled: boolean; 
        excludedPages?: string[];
    };
    stockNotifier: { 
        enabled: boolean;
        title?: string;
        description?: string;
        successMessage?: string;
    };
    promoToast: { 
        enabled: boolean; 
        title?: string;
        description?: string;
        productIds?: string[];
        excludedPages?: string[];
    };
    livechat: {
        enabled: boolean;
        script?: string;
        excludedPages?: string[];
    };
    sgSeo: {
        enabled: boolean;
        // New fields for site-wide default SEO
        defaultTitle?: string;
        defaultDescription?: string;
    };
    analytics?: {
        enabled: boolean;
        script?: string;
        excludedPages?: string[];
    };
}

export interface ApiProviderConfig {
    enabled: boolean;
    apiKey?: string;
    model?: string;
}

export interface Discount {
    id?: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    expiresAt?: Timestamp | Date;
    usageLimit: number;
    timesUsed: number;
    isActive: boolean;
}

export interface PaymentMethodDetails {
    enabled: boolean;
    accountName?: string;
    accountNumber?: string;
    bankShortName?: string;
}

export interface ZaloPayConfig {
    enabled: boolean;
    appId?: string;
    key1?: string;
    key2?: string;
}

export interface LoyaltySettings {
    pointConversionRate: number; // e.g., 1 point per 1000 VND
    tiers: Record<string, LoyaltyTierDetails>;
    resellerLoyaltyTiers?: Record<string, LoyaltyTierDetails>;
}

export interface SiteConfig {
    theme: {
        fontFamily: string;
    };
    header: {
        logoLightUrl: string;
        logoDarkUrl: string;
        navLinks: NavLink[];
    };
    companyInfo: {
        name: string;
        slogan: string;
        address: string;
        email: string;
        phone: string;
        websiteUrl: string;
        taxCode?: string;
        logoUrl?: string;
    };
    hero: {
        backgroundType: '3d-grid' | 'image' | 'image-with-3d-overlay';
        imageUrl: string;
        title: string;
        subtitle: string;
    };
    secondaryFeatures: SecondaryFeature[];
    popularCategories: {
        title: string;
        subtitle: string;
        categories: PopularCategory[];
    };
    featuredProducts: {
        title: string;
        subtitle: string;
        productIds: string[];
    };
    partners: {
        title: string;
        logos: PartnerLogo[];
    };
    shop: ShopSettings;
    footer: {
        linkColumns: FooterLinkColumn[];
    };
    paymentMethods: {
        vietqr: PaymentMethodDetails,
        zalopay: ZaloPayConfig,
        creditcard: { enabled: boolean; }
    },
    authentication: {
      google: { enabled: boolean };
      apple: { enabled: boolean };
      sms: { enabled: boolean };
    };
    email: {
        postmark: {
            serverToken?: string;
            fromEmail?: string;
            replyToEmail?: string;
        };
    };
    emailTemplates: {
        orderConfirmation: EmailTemplate;
        orderStatusUpdate: EmailTemplate;
        passwordChanged: EmailTemplate;
        backInStock: EmailTemplate;
        welcomeAndSetPassword: EmailTemplate;
        forgotPassword: EmailTemplate;
    };
    apiKeys?: {
        google?: ApiProviderConfig;
        openai?: ApiProviderConfig;
        perplexity?: ApiProviderConfig;
    };
    plugins: PluginSettings;
    tax: {
        defaultCountryCode: string;
    };
    loyalty: LoyaltySettings;
    // Site-wide SEO defaults
    seoTitle?: string;
    seoDescription?: string;
}


// Type for Zustand Cart
export interface CartItem extends Product {
    quantity: number;
    selectedVariant: ProductVariant;
}

export interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    appliedDiscount: Discount | null;
    userProfile: UserProfile | null;
    fetchUserProfile: (uid: string) => Promise<void>;
    clearUserProfile: () => void;
    addItem: (item: Product, variant: ProductVariant) => void;
    removeItem: (cartItemId: string) => void;
    setItemQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    setCartOpen: (isOpen: boolean) => void;
    applyDiscount: (discount: Discount) => void;
    removeDiscount: () => void;
    totalPrice: () => number;
    manualDiscountAmount: () => number;
    loyaltyDiscountAmount: () => number;
    discountAmount: () => number;
    subtotalAfterDiscount: () => number;
    vat: () => number;
    totalWithVat: () => number;
    cartCount: () => number;
}


export interface PageContent {
    id: string; // The slug
    title: string;
    content: string; // HTML content
    updatedAt: Timestamp;
    // SEO fields
    seoTitle?: string;
    seoDescription?: string;
}

export interface StockNotification {
    id?: string;
    email: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    productSlug: string;
    createdAt: Timestamp;
    notified: boolean;
}

export interface CampaignHistoryItem {
  id: string;
  subject: string;
  content: string;
  targetAudience: 'all' | 'unpaid' | 'active_30' | 'active_90' | 'inactive_90';
  discountCode?: string;
  sentAt: Timestamp;
  sentCount: number;
  recipients?: CustomerInfo[];
}

export interface TaxRate {
    id: string;
    countryCode: string;
    countryName: string;
    rate: number;
    isEnabled: boolean;
}
