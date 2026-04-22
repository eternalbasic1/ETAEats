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
  themeColor: '#0D0D0D',
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
                background: '#1A1A2E',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
