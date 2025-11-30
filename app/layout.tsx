import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import Providers from '@/components/Providers' // You'll need to create this
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'Zelana',
  description: 'A privacy focused ZK rollup on Solana. Exploring solutions that enchance privacy from the ground up.',
  keywords: [
    "Solana", "Solana zk rollup", "Solana rollup", "rollup", "zk rollup", "L2", "Solana L2", "zero-knowledge"
  ],
  openGraph: {
    title: 'Zelana - Next Generation of Privacy',
    description: 'A privacy focused ZK rollup on Solana',
    url: 'https://zelana.org',
    siteName: 'Zelana',
    images: [
      {
        url: 'https://zelana.org/og-metadata-image.png',
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
    images: ['https://zelana.org/og-metadata-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Zelana",
    "url": "https://zelana.org",
    "logo": "https://zelana.org/og-metadata-image.png",
    "description": "A privacy-focused ZK rollup on Solana, enhancing privacy from the ground up.",
    "sameAs": [
      "https://twitter.com/zelanalabs",
      "https://github.com/zelana-labs"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Zelana",
    "url": "https://zelana.org",
  };
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}