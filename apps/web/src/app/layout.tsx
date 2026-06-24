import type { Metadata, Viewport } from 'next';
import '@beef-cartel/design-system/global.css';
import { rootCssString } from '@beef-cartel/design-system/theme';
import { CartProvider } from '@/components/cart-provider';
import { SwRegister } from '@/components/sw-register';

export const metadata: Metadata = {
  title: { default: 'Beef Cartel — premium boxed beef', template: '%s · Beef Cartel' },
  description:
    'Premium boxed beef, reserved on deposit. MSA 6/7+ cuts — strip loin, eye fillet, brisket, tomahawk. Monthly preorder, delivered.',
  applicationName: 'Beef Cartel',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Beef Cartel', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export const viewport: Viewport = {
  themeColor: '#141210',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Theme tokens → :root custom properties, derived from the design system.
            Server-rendered so there's no flash of unthemed content. */}
        <style dangerouslySetInnerHTML={{ __html: rootCssString() }} />
      </head>
      <body>
        <CartProvider>{children}</CartProvider>
        <SwRegister />
      </body>
    </html>
  );
}
