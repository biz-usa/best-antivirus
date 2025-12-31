
/**
 * @fileoverview
 * This is the central registry for all plugins in the application.
 * To activate a plugin, import its components/hooks here and export them.
 * To deactivate a plugin, simply remove its export from this file.
 *
 * This approach allows for a clean, centralized way to manage which
 * parts of the extensible functionality are active in the app.
 */

// --- Recent Views Plugin ---
// Tracks and displays recently viewed products.
import { useTrackRecentView, RecentViews } from './recent-views';
import { WishlistButton, useWishlistStore } from './wishlist';
import { StockNotifier } from './stock-notifier';
import { PromoToast } from './promo-toast';
import { LivechatScript } from './livechat';
import { AnalyticsScript } from './analytics';

export {
    useTrackRecentView,
    RecentViews,
    WishlistButton,
    useWishlistStore,
    StockNotifier,
    PromoToast,
    LivechatScript,
    AnalyticsScript,
};
