import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import { PersistentBottomNav } from '@/components/layout/PersistentBottomNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'ETA Eats — Order Before You Arrive',
  description: 'Pre-order highway food from your bus',
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <PersistentBottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#111111',
                border: '1px solid #E8E8E2',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
