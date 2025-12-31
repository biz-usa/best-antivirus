

      

import type { Product, Category, Review, Brand, Order, Customer, DailyRevenue, Notification, UsedLicenseKey, UserProfile, SiteConfig, PageContent, ProductVariant, PluginSettings, Discount, CampaignHistoryItem, TaxRate, LoyaltyTierDetails } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, Timestamp, orderBy, limit, collectionGroup, writeBatch, QueryConstraint, setDoc, updateDoc, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { DEFAULT_LOYALTY_TIERS as LOYALTY_TIERS, DEFAULT_LOYALTY_POINT_CONVERSION_RATE as LOYALTY_POINT_CONVERSION_RATE } from './constants';
import { unstable_noStore as noStore } from 'next/cache';
import type { UserRecord } from 'firebase-admin/auth';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


async function _getUnsplashImage(query: string, orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'): Promise<string | null> {
    noStore(); 
    const UNSPLASH_API_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_API_KEY) return null;
    try {
        const cacheBuster = `&cb=${new Date().getTime()}`;
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}&count=3${cacheBuster}`, {
            headers: { Authorization: `Client-ID ${UNSPLASH_API_KEY}` }
        });
        if (!response.ok) {
            console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data: any[] = await response.json();
        if (data && data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.length);
            return data[randomIndex]?.urls?.regular || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching from Unsplash:", error);
        return null;
    }
}


async function _getPexelsImage(query: string, orientation: 'landscape' | 'portrait' | 'square' = 'landscape'): Promise<string | null> {
    noStore();
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    if (!PEXELS_API_KEY) return null;
    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=3`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!response.ok) {
            console.error(`Pexels API error: ${response.status} ${response.statusText}`);
            return null;
        }
        const data: any = await response.json();
        if (data.photos && data.photos.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.photos.length);
            return data.photos[randomIndex]?.src?.large || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching from Pexels:", error);
        return null;
    }
}


export async function getDynamicImage(query: string, orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'): Promise<string> {
    // Map our simple orientation to API-specific values
    const unsplashOrientation = orientation;
    const pexelsOrientation = orientation === 'squarish' ? 'square' : orientation;

    // Prioritize higher quality / more reliable sources
    const imageFetchers = [
        { name: 'Unsplash', fetcher: () => _getUnsplashImage(query, unsplashOrientation) },
        { name: 'Pexels', fetcher: () => _getPexelsImage(query, pexelsOrientation) },
    ];
    
    let imageUrl: string | null = null;

    for (const api of imageFetchers) {
        try {
            console.log(`Trying ${api.name} for "${query}" with orientation "${orientation}"...`);
            imageUrl = await api.fetcher();
            if (imageUrl) {
                console.log(`Found image via ${api.name}.`);
                break; 
            }
             console.log(`${api.name} did not return an image.`);
        } catch (error) {
             console.error(`Error with ${api.name}:`, error);
        }
    }
    
    // If all fail, use a placeholder
    if (imageUrl) {
        return imageUrl;
    }

    console.log(`All image providers failed for "${query}", using placeholder.`);
    const placeholderSize = orientation === 'squarish' ? '800x800' : (orientation === 'portrait' ? '600x800' : '800x600');
    return `https://picsum.photos/${placeholderSize.replace('x','/')}`;
}

// Fetch all products from Firestore with optional filtering
export async function getProducts(
    categorySlug?: string,
    options: {
        search?: string;
        brand?: string;
        status?: 'active' | 'hidden' | 'all';
    } = {}
): Promise<Product[]> {
    const productsCol = collection(db, 'products');
    let queryConstraints: QueryConstraint[] = [];

    if (categorySlug) {
        queryConstraints.push(where('category.slug', '==', categorySlug));
    }
    if (options.brand) {
        queryConstraints.push(where('brand', '==', options.brand));
    }

    // New status filter logic
    if (options.status && options.status !== 'all') {
        queryConstraints.push(where('status', '==', options.status));
    } else if (!options.status || options.status !== 'all') {
        // By default, only get active products unless 'all' or 'hidden' is specified
        queryConstraints.push(where('status', '==', 'active'));
    }
    
    let q = query(productsCol, ...queryConstraints);
  
    const productSnapshot = await getDocs(q);
    
    let productList = productSnapshot.docs.map(doc => {
      const data = doc.data();
      const variants = (data.variants || []).map((variant: ProductVariant) => {
          if (variant.licenseKeys && variant.licenseKeys.used) {
              variant.licenseKeys.used = variant.licenseKeys.used.map((key: UsedLicenseKey) => ({
                  ...key,
                  assignedAt: key.assignedAt instanceof Timestamp ? key.assignedAt.toDate() : key.assignedAt,
              }));
          }
           if (variant.saleStartDate && variant.saleStartDate instanceof Timestamp) {
                variant.saleStartDate = variant.saleStartDate.toDate();
            }
            if (variant.saleEndDate && variant.saleEndDate instanceof Timestamp) {
                variant.saleEndDate = variant.saleEndDate.toDate();
            }
      
          return variant;
      });
      return { id: doc.id, ...data, variants } as Product;
    });

    // Apply search filter client-side after fetching
    if (options.search) {
        const searchTerm = options.search.toLowerCase();
        productList = productList.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }
    
    return productList;
}


// Fetch a single product by its ID from Firestore
export async function getProductById(id: string): Promise<Product | null> {
    if (!id) return null;
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
        const data = productSnap.data();
        
        // Ensure variants exist and process license keys
        const variants = (data.variants || []).map((variant: ProductVariant) => {
            if (variant.licenseKeys && variant.licenseKeys.used) {
                variant.licenseKeys.used = variant.licenseKeys.used.map((key: UsedLicenseKey) => ({
                    ...key,
                    assignedAt: key.assignedAt instanceof Timestamp ? key.assignedAt.toDate() : key.assignedAt,
                }));
            }
            if (variant.saleStartDate && variant.saleStartDate instanceof Timestamp) {
                variant.saleStartDate = variant.saleStartDate.toDate();
            }
            if (variant.saleEndDate && variant.saleEndDate instanceof Timestamp) {
                variant.saleEndDate = variant.saleEndDate.toDate();
            }
            return variant;
        });

        return { id: productSnap.id, ...data, variants } as Product;
    } else {
        return null;
    }
}


// Fetch a single product by its slug from Firestore
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const productsCol = collection(db, 'products');
  const q = query(productsCol, where('slug', '==', slug), where('status', '==', 'active'));
  const productSnapshot = await getDocs(q);

  if (productSnapshot.empty) {
    return undefined;
  }

  const productDoc = productSnapshot.docs[0];
  const productData = productDoc.data();

  // Backward compatibility: If variants don't exist, create one from top-level fields
  if (!productData.variants || productData.variants.length === 0) {
      const defaultVariant: ProductVariant = {
          id: 'default',
          name: 'Mặc định',
          price: productData.price || 0,
          salePrice: productData.salePrice,
          sku: productData.sku || 'N/A',
          attributes: [],
      };
      productData.variants = [defaultVariant];
  }

  return { id: productDoc.id, ...productData } as Product;
}

// Fetch all categories from Firestore
export async function getCategories(): Promise<Category[]> {
  const categoriesCol = collection(db, 'categories');
  const categorySnapshot = await getDocs(query(categoriesCol));
  const categoryList = categorySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
          id: doc.id, 
          slug: doc.id, 
          name: data.name,
          icon: data.icon,
      } as Category;
  });
  return categoryList.sort((a, b) => a.name.localeCompare(b.name));
}


// Get all brands from the 'brands' collection in Firestore
export async function getBrands(asObject: true): Promise<Brand[]>;
export async function getBrands(asObject?: false): Promise<string[]>;
export async function getBrands(asObject: boolean = false): Promise<Brand[] | string[]> {
  const brandsCol = collection(db, 'brands');
  const brandSnapshot = await getDocs(query(brandsCol));
  
  if (asObject) {
    const brandList = brandSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
    return brandList.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  const brandList = brandSnapshot.docs.map(doc => doc.data().name as string);
  return brandList.sort();
}

// Get unique license types from all products in Firestore
export async function getLicenseTypes(): Promise<string[]> {
   const products = await getProducts();
   const licenseTypes = [...new Set(products.map(p => p.licenseType))];
   return licenseTypes.sort();
}

export async function getOrders(params: {
  userId?: string;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData> | null;
  options?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
} = {}): Promise<{ orders: Order[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
    const { userId, limit: queryLimit, startAfter: startAfterDoc, options = {} } = params;
    const ordersCol = collection(db, 'orders');
    let queryConstraints: QueryConstraint[] = [];
    
    if (userId) {
        queryConstraints.push(where('customer.id', '==', userId));
    }
    
    if (options.search) {
        if (options.search.includes('@')) {
            queryConstraints.push(where('customer.email', '==', options.search));
        } else {
            // Cannot combine range filter on 'id' with other inequality filters,
            // so this search will be handled client-side if other filters are present.
        }
    }
    
    if (options.status) {
        queryConstraints.push(where('status', '==', options.status));
    }
    
    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortOrder || 'desc';
    queryConstraints.push(orderBy(sortField, sortDirection));

    if (startAfterDoc) {
        queryConstraints.push(startAfter(startAfterDoc));
    }

    if (queryLimit) {
        queryConstraints.push(limit(queryLimit));
    }
    
    const q = query(ordersCol, ...queryConstraints);
    const orderSnapshot = await getDocs(q);
    
    let orders = orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

    if (options.search && !options.search.includes('@')) {
        const lowerCaseSearch = options.search.toLowerCase();
        orders = orders.filter(order => 
            order.customer.name.toLowerCase().includes(lowerCaseSearch) ||
            order.id.toLowerCase().includes(lowerCaseSearch)
        );
    }
    
    const lastVisible = orderSnapshot.docs.length > 0 ? orderSnapshot.docs[orderSnapshot.docs.length - 1] : null;

    return { orders, lastVisible };
}


export async function getOrderById(id: string): Promise<Order | null> {
    if (!id) return null;
    const orderRef = doc(db, 'orders', id);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
        return { id: orderSnap.id, ...orderSnap.data() } as Order;
    } else {
        return null;
    }
}

export async function getLoyaltyConfig() {
    const config = await getSiteConfig();
    return {
        tiers: config.loyalty?.tiers || LOYALTY_TIERS,
        resellerTiers: config.loyalty?.resellerLoyaltyTiers || config.loyalty?.tiers || LOYALTY_TIERS,
        rate: config.loyalty?.pointConversionRate || LOYALTY_POINT_CONVERSION_RATE,
    };
}


export async function determineLoyaltyTier(points: number, role: 'customer' | 'reseller' = 'customer'): Promise<LoyaltyTierDetails> {
    const { tiers, resellerTiers } = await getLoyaltyConfig();
    const relevantTiers = role === 'reseller' ? resellerTiers : tiers;
    
    let determinedTier: LoyaltyTierDetails = relevantTiers['bronze'];
    const tierOrder: (keyof typeof relevantTiers)[] = ['diamond', 'gold', 'silver', 'bronze'];

    for (const tierKey of tierOrder) {
        const tier = relevantTiers[tierKey];
        if (points >= tier.minPoints) {
            determinedTier = tier;
            break;
        }
    }
    return determinedTier;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        return null;
    }

    return { uid: userSnap.id, ...userSnap.data() } as UserProfile;
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueByDay: DailyRevenue[];
}> {
    const [ordersSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users')),
    ]);

    const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = ordersSnapshot.size;
    const totalProducts = productsSnapshot.size;
    const totalCustomers = usersSnapshot.size;
    
    // Calculate revenue for the last 7 days
    const revenueByDay: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        revenueByDay[date] = 0;
    }

    orders.forEach(order => {
        if (order.createdAt) {
             const orderDate = format(order.createdAt.toDate(), 'yyyy-MM-dd');
             if (revenueByDay[orderDate] !== undefined) {
                 revenueByDay[orderDate] += order.total;
             }
        }
    });

    const chartData = Object.keys(revenueByDay).map(date => ({
        date,
        revenue: revenueByDay[date],
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        revenueByDay: chartData,
    };
}


// Fetch notifications for a user
export async function getNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    const notificationsCol = collection(db, 'notifications');
    const q = query(
        notificationsCol, 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc'),
        limit(10) // Limit to last 10 notifications
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error: any) {
        if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
             const permissionError = new FirestorePermissionError({
                path: `users/${userId}/notifications`, // This is an approximation
                operation: 'list',
                message: `Failed to fetch notifications: ${error.message}`,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        // Return empty array to prevent crashing the UI, error is handled globally
        return [];
    }
}

// Mark notifications as read
export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
    if (!userId || notificationIds.length === 0) return;
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const notifRef = doc(db, 'notifications', id);
        batch.update(notifRef, { read: true });
    });
    
    try {
        await batch.commit();
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `users/${userId}/notifications`, // Path is an approximation for context
                operation: 'update',
                message: 'Failed to mark notifications as read due to permissions.',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        // Allow the original error to be thrown to be caught by the calling function.
        throw serverError;
    }
}


export const defaultSiteConfig: SiteConfig = {
    theme: {
        fontFamily: 'Inter',
    },
    header: {
        logoLightUrl: 'https://firebasestorage.googleapis.com/v0/b/saigonsoftcom-xrkmx.appspot.com/o/site_assets%2Fsaigonsoft-logo-dark.png?alt=media&token=16141a54-72eb-4581-b552-519a865761c4',
        logoDarkUrl: 'https://firebasestorage.googleapis.com/v0/b/saigonsoftcom-xrkmx.appspot.com/o/site_assets%2Fsaigonsoft-logo-light.png?alt=media&token=a35f9a65-b5f7-4df3-8820-213a7c3b1eb3',
        navLinks: [
            { text: "Phần mềm", href: "/products" },
            { text: "Tài liệu cài đặt", href: "/documents" },
            { text: "Developer", href: "/pages/developer" },
            { text: "Giới thiệu", href: "/pages/about" },
        ]
    },
    companyInfo: {
        name: 'Công ty TNHH Saigon Enterprise Group',
        slogan: 'Giải pháp phần mềm toàn diện',
        address: '72 Lê Thánh Tôn, P. Bến Nghé, Quận 1, TP.HCM',
        email: 'contact@saigonsoft.com',
        phone: '(+84) 28 3822 8899',
        websiteUrl: 'https://saigonsoft.com',
        taxCode: '0312345678',
        logoUrl: 'https://firebasestorage.googleapis.com/v0/b/saigonsoftcom-xrkmx.appspot.com/o/site_assets%2Fsaigonsoft-logo-dark.png?alt=media&token=16141a54-72eb-4581-b552-519a865761c4',
    },
    hero: {
        backgroundType: "3d-grid",
        imageUrl: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        title: "Phần mềm cho những gì bạn làm tiếp theo",
        subtitle: "Khám phá các giải pháp phần mềm bản quyền hàng đầu giúp bạn làm việc, sáng tạo và kết nối hiệu quả hơn."
    },
    secondaryFeatures: [
        { icon: "Laptop", title: 'Dành cho cá nhân', href: '/products', linkText: 'Mua ngay' },
        { icon: "Briefcase", title: 'Dành cho doanh nghiệp', href: '/category/kinh-doanh-ke-toan', linkText: 'Mua ngay' },
        { icon: "Users", title: 'Dành cho đối tác', href: '/pages/about', linkText: 'Liên hệ' },
        { icon: "Shield", title: 'Bảo mật & an toàn', href: '/category/bao-mat-diet-virus', linkText: 'Tìm hiểu' },
    ],
    popularCategories: {
        title: "Khám phá các danh mục hàng đầu",
        subtitle: "Tìm kiếm giải pháp hoàn hảo cho mọi nhu cầu của bạn, từ công việc đến giải trí.",
        categories: [
            { name: 'Thiết kế & Đồ họa', slug: 'thiet-ke-do-hoa', icon: "Paintbrush" },
            { name: 'Phần mềm văn phòng', slug: 'phan-mem-van-phong', icon: "FileText" },
            { name: 'Bảo mật & Diệt Virus', slug: 'bao-mat-diet-virus', icon: "Shield" },
            { name: 'Kinh doanh & Kế toán', slug: 'kinh-doanh-ke-toan', icon: "Briefcase" },
            { name: 'Hệ điều hành', slug: 'he-dieu-hanh', icon: "Computer" },
            { name: 'Tiện ích hệ thống', slug: 'tien-ich-he-thong', icon: "Wrench" },
        ]
    },
    featuredProducts: {
        title: "Sản phẩm nổi bật",
        subtitle: "Các phần mềm được tin dùng và bán chạy nhất tại Saigonsoft.com.",
        productIds: [],
    },
    partners: {
        title: 'Đối tác của chúng tôi',
        logos: [
            { name: 'Microsoft', brand: 'Microsoft' },
            { name: 'Adobe', brand: 'Adobe' },
            { name: 'Autodesk', brand: 'Autodesk' },
            { name: 'Kaspersky', brand: 'Kaspersky' },
            { name: 'MISA', brand: 'MISA' },
            { name: 'Google', brand: 'Google' },
        ]
    },
    shop: {
        popularSearches: ['Microsoft 365', 'Adobe Photoshop', 'Kaspersky', 'Windows 11', 'AutoCAD', 'MISA'],
        filters: [
            { id: 'categories', name: 'Danh mục', enabled: true },
            { id: 'brands', name: 'Thương hiệu', enabled: true },
            { id: 'licenseTypes', name: 'Loại giấy phép', enabled: true },
            { id: 'priceRange', name: 'Khoảng giá', enabled: true },
            { id: 'attributes', name: 'Thuộc tính', enabled: true },
            { id: 'onSale', name: 'Đang giảm giá', enabled: true },
            { id: 'inStock', name: 'Có hàng', enabled: true },
            { id: 'newArrivals', name: 'Hàng mới', enabled: true },
        ],
        checkout: {
            showGoogleLogin: true,
            showAppleLogin: true,
        }
    },
    footer: {
        linkColumns: [
            { title: "Sản phẩm", links: [
                { text: "Bảo mật & Diệt Virus", href: "/category/bao-mat-diet-virus" },
                { text: "Hệ điều hành", href: "/category/he-dieu-hanh" },
                { text: "Văn phòng", href: "/category/phan-mem-van-phong" },
                { text: "Thiết kế & Đồ họa", href: "/category/thiet-ke-do-hoa" },
            ] },
            { title: "Chính sách", links: [
                { text: "Điều khoản sử dụng", href: "/pages/terms-of-use" },
                { text: "Quyền riêng tư", href: "/pages/privacy-policy" },
                { text: "Đổi trả & Hoàn tiền", href: "/pages/refund-policy" },
            ] },
            { title: "Hỗ trợ", links: [
                { text: "Liên hệ", href: "/pages/contact" },
                { text: "Tài liệu cài đặt", href: "/documents" },
                { text: "Câu hỏi thường gặp", href: "/documents" },
                { text: "Developer", href: "/pages/developer" },
            ] },
             { title: "Tài khoản", links: [
                { text: "Hồ sơ của tôi", href: "/profile" },
                { text: "Lịch sử đơn hàng", href: "/order-history" },
                { text: "Đăng nhập", href: "/login" },
                { text: "Đăng ký", href: "/register" },
            ] },
            { title: "Tải về", authRequired: true, links: [
                { text: "Tải về & Giấy phép", href: "/downloads" },
            ] },
        ]
    },
    paymentMethods: {
        vietqr: { enabled: true, accountName: 'CONG TY TNHH TEST', accountNumber: '0123456789', bankShortName: 'vietinbank' },
        zalopay: { enabled: false },
        creditcard: { enabled: false }
    },
    authentication: {
      google: { enabled: true },
      apple: { enabled: true },
      sms: { enabled: true },
    },
    email: {
        postmark: {
            serverToken: '',
            fromEmail: '',
            replyToEmail: '',
        },
    },
    emailTemplates: {
        orderConfirmation: {
            subject: "[Saigonsoft.com] Xác nhận đơn hàng #{{order_id}}",
            body: `
                <h1>Xác nhận đơn hàng #{{order_id}}</h1>
                <p>Chào {{customer_name}},</p>
                <p>Cảm ơn bạn đã mua hàng tại Saigonsoft.com. Chúng tôi đã nhận được đơn hàng của bạn và sẽ xử lý ngay khi nhận được thanh toán.</p>
                <p>Bạn có thể xem lại lịch sử đơn hàng của mình bất cứ lúc nào bằng cách truy cập vào <a href="{{order_history_url}}">trang lịch sử đơn hàng</a>.</p>
                <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `,
        },
        orderStatusUpdate: {
            subject: "[Saigonsoft.com] Cập nhật trạng thái đơn hàng #{{order_id}}",
            body: `
                <h1>Cập nhật đơn hàng</h1>
                <p>Chào {{customer_name}},</p>
                <p>Chúng tôi xin thông báo trạng thái đơn hàng <strong>#{{order_id}}</strong> của bạn đã được cập nhật thành: <strong>{{new_status}}</strong></p>
                <p>Bạn có thể xem chi tiết đơn hàng của mình bằng cách truy cập vào <a href="{{order_details_url}}">trang chi tiết đơn hàng</a>.</p>
                 {{#if is_completed}}
                <p>Bạn hiện có thể truy cập trang <a href="{{site_url}}/profile/downloads">Tải về</a> trong tài khoản của mình để nhận sản phẩm.</p>
                {{/if}}
                <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `,
        },
        passwordChanged: {
            subject: "[Saigonsoft.com] Cảnh báo bảo mật: Mật khẩu đã được thay đổi",
            body: `
                <h1>Cảnh báo bảo mật</h1>
                <p>Chào {{customer_name}},</p>
                <p>Chúng tôi xin thông báo rằng mật khẩu cho tài khoản Saigonsoft.com liên kết với email này đã được thay đổi.</p>
                <p>Nếu bạn là người đã thực hiện thay đổi này, bạn có thể bỏ qua thông báo này.</p>
                <p><strong>Nếu bạn không thực hiện thay đổi này</strong>, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.</p>
                <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `
        },
        backInStock: {
            subject: "[Saigonsoft.com] Thông báo: Sản phẩm bạn quan tâm đã có hàng!",
            body: `
                 <h1>Sản phẩm đã có hàng trở lại!</h1>
                 <p>Chào bạn,</p>
                 <p>Chúng tôi rất vui được thông báo rằng sản phẩm bạn đã đăng ký nhận thông tin: <strong>{{product_name}} - {{variant_name}}</strong>, hiện đã có hàng trở lại.</p>
                 <p>Bạn có thể mua ngay bây giờ bằng cách nhấp vào nút bên dưới:</p>
                 <p><a href="{{product_url}}" style="background-color: #0056b3; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Mua ngay</a></p>
                 <p>Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi!</p>
                 <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `
        },
        welcomeAndSetPassword: {
            subject: "Chào mừng bạn đến với Saigonsoft.com! Vui lòng thiết lập mật khẩu.",
            body: `
                <h1>Chào mừng bạn đến với Saigonsoft.com!</h1>
                <p>Chào {{customer_name}},</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất việc thiết lập, vui lòng nhấp vào liên kết bên dưới để đặt mật khẩu cho tài khoản của bạn.</p>
                <p><a href="{{reset_link}}" style="background-color: #0056b3; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt mật khẩu của bạn</a></p>
                <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `
        },
        forgotPassword: {
            subject: "Yêu cầu đặt lại mật khẩu cho tài khoản Saigonsoft.com của bạn",
            body: `
                <h1>Đặt lại mật khẩu</h1>
                <p>Chào {{customer_name}},</p>
                <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết bên dưới để tạo mật khẩu mới:</p>
                <p><a href="{{reset_link}}" style="background-color: #0056b3; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a></p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                <p>Trân trọng,<br>Đội ngũ Saigonsoft.com</p>
            `
        },
    },
    apiKeys: {
        google: { enabled: false },
        openai: { enabled: false },
        perplexity: { enabled: false },
    },
    plugins: {
        recentViews: { enabled: true, excludedPages: [] },
        wishlist: { enabled: true, excludedPages: [] },
        stockNotifier: { 
            enabled: true,
            title: 'Thông báo khi có hàng trở lại',
            description: 'Sản phẩm **%PRODUCT_NAME% - %VARIANT_NAME%** hiện đang tạm hết hàng. Vui lòng nhập email của bạn bên dưới để chúng tôi có thể thông báo cho bạn ngay khi có hàng.',
            successMessage: 'Đã đăng ký thành công! Chúng tôi sẽ thông báo cho bạn ngay khi sản phẩm có hàng trở lại.'
        },
        promoToast: { 
            enabled: true, 
            title: 'Ưu đãi đặc biệt ✨',
            description: 'Khám phá %PRODUCT_NAME%, một trong những sản phẩm bán chạy nhất của chúng tôi!',
            productIds: [],
            excludedPages: [],
        },
        livechat: {
            enabled: false,
            script: '',
            excludedPages: [],
        },
        sgSeo: {
            enabled: true,
        },
        analytics: {
            enabled: false,
            script: '',
            excludedPages: [],
        }
    },
    tax: {
        defaultCountryCode: 'VN',
    },
    loyalty: {
        pointConversionRate: LOYALTY_POINT_CONVERSION_RATE,
        tiers: LOYALTY_TIERS,
        resellerLoyaltyTiers: LOYALTY_TIERS,
    }
};

async function fetchSiteConfig(): Promise<SiteConfig> {
    noStore();
    const configRef = doc(db, 'site_config', 'main');
    const docSnap = await getDoc(configRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            ...defaultSiteConfig,
            ...data,
            // Deep merge nested objects to ensure all default fields are present
            header: { ...defaultSiteConfig.header, ...(data.header || {}) },
            companyInfo: { ...defaultSiteConfig.companyInfo, ...(data.companyInfo || {}) },
            hero: { ...defaultSiteConfig.hero, ...(data.hero || {}) },
            shop: { ...defaultSiteConfig.shop, ...(data.shop || {}) },
            footer: { ...defaultSiteConfig.footer, ...(data.footer || {}) },
            paymentMethods: { ...defaultSiteConfig.paymentMethods, ...(data.paymentMethods || {}) },
            authentication: { ...defaultSiteConfig.authentication, ...(data.authentication || {}) },
            email: { ...defaultSiteConfig.email, ...(data.email || {}) },
            emailTemplates: { ...defaultSiteConfig.emailTemplates, ...(data.emailTemplates || {}) },
            plugins: { ...defaultSiteConfig.plugins, ...(data.plugins || {}) },
            tax: { ...defaultSiteConfig.tax, ...(data.tax || {}) },
            loyalty: { ...defaultSiteConfig.loyalty, ...(data.loyalty || {}) },
        };
    }
    
    return defaultSiteConfig;
}

export const getSiteConfig = fetchSiteConfig;


export async function getPages(): Promise<PageContent[]> {
    const pagesCol = collection(db, 'pages');
    const pageSnapshot = await getDocs(query(pagesCol));
    const pageList = pageSnapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data()
    } as PageContent));
    return pageList;
}

export async function getPageBySlug(slug: string): Promise<PageContent | null> {
    if (!slug) return null;
    const pageRef = doc(db, 'pages', slug);
    const pageSnap = await getDoc(pageRef);
    if (!pageSnap.exists()) {
        return null;
    }
    const pageData = pageSnap.data();
    // Ensure updatedAt is a Timestamp before converting
    if (pageData.updatedAt && pageData.updatedAt.toDate) {
         return { id: pageSnap.id, ...pageData, updatedAt: pageData.updatedAt } as PageContent;
    }
    return { id: pageSnap.id, ...pageData } as PageContent;
}

export async function getShopSettings(): Promise<SiteConfig['shop']> {
  const config = await getSiteConfig();
  return config.shop;
}

export async function getDiscounts(): Promise<Discount[]> {
    const discountsCol = collection(db, 'discounts');
    const snapshot = await getDocs(discountsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discount));
}

export async function getCampaignHistory(): Promise<CampaignHistoryItem[]> {
    const campaignsCol = collection(db, 'email_campaigns');
    const q = query(campaignsCol, orderBy('sentAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampaignHistoryItem));
}

export async function getTaxRates(): Promise<TaxRate[]> {
    const taxRatesCol = collection(db, 'tax_rates');
    const snapshot = await getDocs(query(taxRatesCol, orderBy('countryName')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaxRate));
}

export async function updateSiteConfig(data: Partial<SiteConfig>) {
  const configRef = doc(db, 'site_config', 'main');
  try {
    // Firestore's { merge: true } handles deep merging for nested objects.
    await setDoc(configRef, data, { merge: true });
  } catch (error) {
    console.error('Failed to update site config:', error);
    throw new Error('Could not update site configuration.');
  }
}
    

    







