
import type { LoyaltyTierDetails } from './types';

export const VAT_RATE = 0.08; 

// This will now be configurable in the CMS. This value serves as a fallback.
export const DEFAULT_LOYALTY_POINT_CONVERSION_RATE = 1 / 1000; 

// This will now be configurable in the CMS. This value serves as a fallback.
export const DEFAULT_LOYALTY_TIERS: Record<string, LoyaltyTierDetails> = {
    bronze: {
        name: 'Đồng',
        minPoints: 0,
        discountPercentage: 0,
        benefits: ['Hỗ trợ qua email', 'Nhận thông tin khuyến mãi sớm nhất']
    },
    silver: {
        name: 'Bạc',
        minPoints: 5000,
        discountPercentage: 3,
        benefits: ['Tất cả quyền lợi hạng Đồng', 'Giảm giá 3% cho mọi đơn hàng', 'Ưu tiên hỗ trợ']
    },
    gold: {
        name: 'Vàng',
        minPoints: 15000,
        discountPercentage: 5,
        benefits: ['Tất cả quyền lợi hạng Bạc', 'Giảm giá 5% cho mọi đơn hàng', 'Quà tặng vào ngày sinh nhật']
    },
    diamond: {
        name: 'Kim Cương',
        minPoints: 50000,
        discountPercentage: 8,
        benefits: ['Tất cả quyền lợi hạng Vàng', 'Giảm giá 8% cho mọi đơn hàng', 'Miễn phí một số sản phẩm mới', 'Hỗ trợ trực tiếp 24/7']
    },
};
