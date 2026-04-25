import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ETAEats — Kitchen Console',
  description: 'Live orders, menu, and operations for highway kitchens.',
}

export const viewport: Viewport = {
  themeColor: '#F5F5F2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&f[]=general-sans@300,400,500,600,700&display=swap"
        />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#111111',
                border: '1px solid #E8E8E2',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 12px 28px rgba(17, 17, 17, 0.07), 0 2px 4px rgba(17, 17, 17, 0.04)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
