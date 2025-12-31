# Wishlist Plugin

This plugin provides a "wishlist" or "favorites" functionality for users.

## Features

- **`WishlistButton` Component**: A client-side heart icon button that can be placed on product cards or product detail pages.
- **`useWishlistStore` Hook**: A Zustand store to manage the state of the wishlist across the application.
- **Persistent State**: The wishlist is saved to the user's `localStorage`, so it persists across sessions.
- **Authentication-aware**: The wishlist is unique to each logged-in user.

## Usage

### Displaying the Wishlist Button

Place the `WishlistButton` component wherever you want the user to be able to "favorite" a product.

```jsx
import { WishlistButton } from '@/plugins/registry';
import type { Product } from '@/lib/types';

function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      {/* ... other product info */}
      <WishlistButton product={product} />
    </div>
  );
}
```

### Accessing the Wishlist State

You can use the `useWishlistStore` hook in any component to access the list of favorited products or actions to modify it.

```jsx
import { useWishlistStore } from '@/plugins/registry';

function MyWishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlistStore();

  return (
    <div>
      <h1>My Wishlist</h1>
      {wishlist.map(product => (
        <div key={product.id}>
          {product.name}
          <button onClick={() => removeFromWishlist(product.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```
