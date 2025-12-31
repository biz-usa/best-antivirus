
'use client';

// This is a re-export of the customer downloads page.
// We are creating a new route for resellers to ensure they stay within the
// reseller-specific layout and navigation context. The underlying component
// is authentication-aware and will show the correct data for the logged-in user.

import DownloadsPage from '@/app/profile/downloads/page';

export default DownloadsPage;
