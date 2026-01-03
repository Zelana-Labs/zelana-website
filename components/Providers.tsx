// components/Providers.tsx
'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cmgho9rbv0013ld0c1z14rjbo"
      config={{
        // Solana RPC configuration (top-level, not inside embeddedWallets)
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc('http://127.0.0.1:8899'),
              rpcSubscriptions: createSolanaRpcSubscriptions('ws://127.0.0.1:8900')
            },
            'solana:devnet': {
              rpc: createSolanaRpc('http://127.0.0.1:8899'),
              rpcSubscriptions: createSolanaRpcSubscriptions('ws://127.0.0.1:8900')
            }
          }
        },
        appearance: {
          accentColor: "#000000",
          theme: "light",
          showWalletLoginFirst: false,
          walletChainType: 'solana-only',
          logo: "https://raw.githubusercontent.com/Zelana-Labs/zksvm/refs/heads/main/assets/logo/zelana-logo-transparant.png",
        },
        loginMethods: ["email", "google", "wallet"],
        // External wallet connectors for Phantom, Solflare, etc.
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors()
          }
        },
        // Embedded wallet creation
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets"
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  )
}