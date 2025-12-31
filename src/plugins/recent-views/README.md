
# Recent Views Plugin

This plugin provides functionality to track and display recently viewed products for a user.

## Features

- **`useTrackRecentView` Hook**: A client-side hook to register a product as "viewed".
- **`RecentViews` Component**: A client-side component that displays a list of the last 4 unique products the user has viewed.

## Usage

### Tracking a view

In your product detail page component, import and use the hook. Call `addProduct` within a `useEffect` when the product data is available.

```jsx
import { useTrackRecentView } from '@/plugins/recent-views';
import type { Product } from '@/lib/types';
import { useEffect } from 'react';

function ProductPage({ product }: { product: Product }) {
  const { addProduct } = useTrackRecentView();

  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product, addProduct]);

  // ... rest of your component
}
```

### Displaying the list

In any layout or page where you want to display the list of recently viewed items, import and use the `RecentViews` component.

```jsx
import { RecentViews } from '@/plugins/registry';

export default function MyPage() {
  return (
    <div>
      {/* Other content */}
      <RecentViews currentProductId={...} />
    </div>
  );
}
```

### Props for `RecentViews`

- `currentProductId` (optional, string): The ID of the product currently being viewed. If provided, this product will be excluded from the "Recently Viewed" list to avoid redundancy.
