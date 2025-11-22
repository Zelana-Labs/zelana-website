import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import Providers from '@/components/Providers' // You'll need to create this
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'Zelana',
  description: 'A privacy focused ZK rollup on Solana',
  openGraph: {
    title: 'Zelana - Next Generation of Privacy',
    description: 'A privacy focused ZK rollup on Solana',
    url: 'https://zelana.org',
    siteName: 'Zelana',
    images: [
      {
        url: 'https://zelana.org/og-metadata-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Preview image',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zelana',
    description: 'A privacy focused ZK rollup on Solana',
    images: ['https://zelana.org/og-metadata-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar/>
          {children}
        </Providers>
      </body>
    </html>
  )
}