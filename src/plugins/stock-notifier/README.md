# Back in Stock Notifier Plugin

This plugin provides a user interface for customers to request notifications for out-of-stock products.

## Features

- **`StockNotifier` Component**: A client-side component that replaces the "Add to Cart" button for out-of-stock items.
- **Email Collection**: When a user clicks the button, a dialog box appears, allowing them to enter their email to be notified.
- **Integration**: The component is designed to be dropped directly into the product purchasing area.

## Usage

The `StockNotifier` component is intended to be used within other components, such as the `AddToCartButton`. When a product variant is detected as out of stock, `AddToCartButton` will render `StockNotifier` instead.

```jsx
import { StockNotifier } from '@/plugins/registry';
import { Button } from '@/components/ui/button';

function AddToCartButton({ product, variant, disabled }) {
  if (disabled) {
    return <StockNotifier product={product} variant={variant} />;
  }

  // ... render normal add to cart button
}
```

## Props for `StockNotifier`

- `product`: The full `Product` object.
- `variant`: The specific `ProductVariant` that is out of stock.
