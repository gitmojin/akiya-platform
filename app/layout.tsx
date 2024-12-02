// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Akiya Find',
  description: 'Find your perfect akiya in Japan',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full fixed inset-0 overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}