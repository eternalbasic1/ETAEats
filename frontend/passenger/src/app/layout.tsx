import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ETA Eats — Order Before You Arrive',
  description: 'Pre-order highway food from your bus',
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#111827',
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
