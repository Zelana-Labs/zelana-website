'use client'

import './globals.css'
import { Inter } from 'next/font/google'
//import { cookies } from 'next/headers'
import { PrivyProvider } from '@privy-io/react-auth';
import Navbar from '@/components/ui/Navbar';


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body>
          <PrivyProvider
            appId="cmgho9rbv0013ld0c1z14rjbo"
            config={{
              embeddedWallets:{
               createOnLogin: 'users-without-wallets'
              },
              appearance: {
                accentColor: "#000000",
                theme: "#FFFFFF",
                showWalletLoginFirst: false,
                logo: "https://raw.githubusercontent.com/Zelana-Labs/zksvm/refs/heads/main/assets/logo/zelana-logo-transparant.png",
              },
              loginMethods: [
                "email",
                "google",
                "wallet"
              ],
            }}
          >
            <Navbar/>
            {children}
          </PrivyProvider>
      </body>
    </html>
  )
}