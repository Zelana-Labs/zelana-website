"use client";

/**
 * L2 Wallet Context
 * 
 * Provides L2 wallet state and SDK client access throughout the app.
 * 
 * IMPORTANT: The L2 address is now the same as the L1 Solana address (hex-encoded).
 * This ensures that deposits from L1 go to the correct L2 account that the user
 * can actually spend from with transfers and withdrawals.
 * 
 * Shielded keys are derived deterministically from the Solana public key.
 * The shielded PUBLIC KEY is derived using MiMC hash (via WASM ownership prover)
 * to match the Noir circuits. The spending key derivation uses SHA-512.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useWallets as useWalletsSolana } from '@privy-io/react-auth/solana';
import { ZelanaClient, bytesToHex, base58ToBytes } from '@zelana/sdk';
import type { ShieldedKeys } from '@zelana/sdk';
import { WalletSigner, type SignableWallet } from '@/lib/wallet-signer';
import { config } from '@/lib/config';
import { sha512 } from '@noble/hashes/sha2.js';
import { initOwnershipProver, derivePublicKey as wasmDerivePublicKey, hexToBytes as proverHexToBytes } from '@/lib/ownership-prover';

// Types

export interface L2WalletContextValue {
  /** Whether the L2 wallet is ready (wallet connected) */
  isReady: boolean;
  /** Whether a transaction is being signed */
  isSigning: boolean;
  /** The Zelana SDK client (null if wallet not connected) */
  client: ZelanaClient | null;
  /** The L2 address as hex string (same as L1 address, hex-encoded) */
  l2Address: string;
  /** The L1 wallet address (from Privy, base58) */
  l1Address: string | null;
  /** Shielded keys derived from wallet (spending, viewing, public) */
  shieldedKeys: ShieldedKeys | null;
  /** Shielded public key as hex string */
  shieldedAddress: string;
  /** Error from last operation */
  error: Error | null;
  /** Clear any errors */
  clearError: () => void;
}

// Context

const L2WalletContext = createContext<L2WalletContextValue | null>(null);

/**
 * Hook to access L2 wallet state and functions
 */
export function useL2Wallet(): L2WalletContextValue {
  const context = useContext(L2WalletContext);
  if (!context) {
    throw new Error('useL2Wallet must be used within an L2WalletProvider');
  }
  return context;
}

/**
 * Derive shielded spending key from Solana public key
 * Uses SHA-512 with domain separation for deterministic derivation
 */
function deriveShieldedSpendingKey(solanaPublicKey: Uint8Array): Uint8Array {
  const domain = new TextEncoder().encode('ZelanaShieldedSpendingKey');
  const hash = sha512(new Uint8Array([...domain, ...solanaPublicKey]));
  return hash.slice(0, 32);
}

/**
 * Derive viewing key from spending key (for note decryption)
 * Uses SHA-512 with domain separation
 */
function deriveViewingKey(spendingKey: Uint8Array): Uint8Array {
  const domain = new TextEncoder().encode('ZelanaIVK');
  const combined = new Uint8Array(domain.length + spendingKey.length);
  combined.set(domain);
  combined.set(spendingKey, domain.length);
  const hash = sha512(combined);
  return hash.slice(0, 32);
}

// Provider

export interface L2WalletProviderProps {
  children: React.ReactNode;
}

/**
 * L2 Wallet Provider
 * 
 * Wrap your app (or dashboard) with this provider to enable L2 wallet functionality.
 * 
 * The L2 address is now the hex-encoded Solana public key. This means:
 * - Deposits from L1 go to this address
 * - Transfers and withdrawals use this address
 * - No more address mismatch issues!
 * 
 * Shielded keys are derived deterministically from the Solana public key.
 * - Spending key: SHA-512(domain || solana_pubkey)
 * - Viewing key: SHA-512(domain || spending_key)
 * - Public key: MiMC_hash3(PK_DOMAIN, spending_key, 0) via WASM prover (matches Noir circuits)
 */
export function L2WalletProvider({ children }: L2WalletProviderProps) {
  const { wallets } = useWalletsSolana();
  const wallet = wallets[0];
  const l1Address = wallet?.address ;
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Shielded keys state (async because WASM prover is async)
  const [shieldedKeys, setShieldedKeys] = useState<ShieldedKeys | null>(null);
  const [shieldedAddress, setShieldedAddress] = useState<string>("");
  
  // Create SDK client when wallet is available
  const client = useMemo(() => {
    if (!wallet) return null;
    // Create a WalletSigner that uses the Solana wallet directly
    const signer = new WalletSigner(wallet as SignableWallet);
    
    return new ZelanaClient({
      baseUrl: config.sequencerUrl,
      chainId: BigInt(1), // Devnet chain ID
      signer,
    });
  }, [wallet]);
  
  
  // L2 address is the hex-encoded Solana public key
  const l2Address = useMemo(() => {
    if (!wallet?.address) return "";
    try {
      const pubkeyBytes = base58ToBytes(wallet.address);
      return bytesToHex(pubkeyBytes);
    } catch {
      return "";
    }
  }, [wallet?.address]);
  
  // Derive shielded keys from Solana wallet using WASM prover for public key
  useEffect(() => {
    if (!wallet?.address) {
      setShieldedKeys(null);
      setShieldedAddress("");
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      try {
        const pubkeyBytes = base58ToBytes(wallet.address);
        const spendingKey = deriveShieldedSpendingKey(pubkeyBytes);
        const viewingKey = deriveViewingKey(spendingKey);
        
        // Initialize WASM prover and derive public key using MiMC (matches Noir circuits)
        await initOwnershipProver();
        const spendingKeyHex = bytesToHex(spendingKey);
        const publicKeyHex = await wasmDerivePublicKey(spendingKeyHex);
        
        // Convert hex public key to bytes
        const publicKey = proverHexToBytes(publicKeyHex);
        
        if (cancelled) return;
        
        const keys: ShieldedKeys = {
          spendingKey,
          viewingKey,
          publicKey,
        };
        
        setShieldedKeys(keys);
        setShieldedAddress(publicKeyHex);
        
        console.log('[L2WalletContext] Shielded keys derived with MiMC public key:', publicKeyHex.slice(0, 16) + '...');
      } catch (err) {
        console.error('[L2WalletContext] Failed to derive shielded keys:', err);
        if (!cancelled) {
          setShieldedKeys(null);
          setShieldedAddress("");
        }
      }
    })();
    
    return () => { cancelled = true; };
  }, [wallet?.address]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const value: L2WalletContextValue = {
    isReady: !!wallet,
    isSigning,
    client,
    l2Address,
    l1Address,
    shieldedKeys,
    shieldedAddress,
    error,
    clearError,
  };
  return (
    <L2WalletContext.Provider value={value}>
      {children}
    </L2WalletContext.Provider>
  );
}
