// components/Providers.tsx
'use client'

import { PrivyProvider } from '@privy-io/react-auth'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmgho9rbv0013ld0c1z14rjbo"
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        appearance: {
          accentColor: "#000000",
          theme: "#FFFFFF",
          showWalletLoginFirst: false,
          logo: "https://raw.githubusercontent.com/Zelana-Labs/zksvm/refs/heads/main/assets/logo/zelana-logo-transparant.png",
        },
        loginMethods: ["email", "google", "wallet"],
      }}
    >
      {children}
    </PrivyProvider>
  )
}