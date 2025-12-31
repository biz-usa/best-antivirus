# Promotional Toast Plugin

This plugin displays a non-intrusive "toast" notification to highlight a featured product to the user after a certain amount of time on the site.

## Features

- **`PromoToast` Component**: A client-side component that, when placed in the root layout, will automatically trigger a notification.
- **Random Product Selection**: It picks a random product from the list of "Featured Products" configured in the CMS.
- **Smart Triggering**: The toast only appears once per session and after a 15-second delay to avoid being intrusive.

## Usage

Place the `PromoToast` component in your root layout file (`src/app/layout.tsx`) inside the `AuthProvider` to ensure it has access to all necessary context.

```jsx
import { PromoToast } from '@/plugins/registry';

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <PromoToast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Configuration

This plugin uses the list of **Featured Products** from your CMS settings (`Appearance > Featured Products`). Ensure you have at least one product selected there for the toast to work.
