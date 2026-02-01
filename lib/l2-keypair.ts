/**
 * L2 Keypair Derivation
 * 
 * Derives a deterministic L2 keypair from a user's Solana wallet signature.
 * This allows users to have a consistent L2 identity without managing separate keys.
 */

import { Keypair } from '@zelana/sdk';
import { sha256 } from '@noble/hashes/sha2.js';

// Storage key for persisted keypair
const STORAGE_KEY = 'zelana-l2-keypair';
const STORAGE_VERSION = 1;

/**
 * The message that users sign to derive their L2 keypair.
 * This is deterministic so the same keypair is derived each time.
 */
export function getDerivationMessage(domain: string): string {
  return `Zelana L2 Access

Domain: ${domain}
Version: ${STORAGE_VERSION}

Sign this message to unlock your L2 wallet.
This signature will be used to derive your L2 keypair.
No transaction will be sent.`;
}

/**
 * Wallet interface for signing messages
 */
export interface SignableWallet {
  address: string;
  signMessage: (args: { message: Uint8Array }) => Promise<
    | { signature: Uint8Array | string }
    | Uint8Array
  >;
}

/**
 * Derive an L2 keypair from a wallet signature.
 * 
 * The process:
 * 1. User signs a deterministic message
 * 2. The signature is hashed with SHA-256
 * 3. The hash is used as the seed for an Ed25519 keypair
 * 
 * @param wallet - The Solana wallet to sign with
 * @returns The derived Keypair
 */
export async function deriveL2Keypair(wallet: SignableWallet): Promise<Keypair> {
  // Get domain for message
  const domain = typeof window !== 'undefined' ? window.location.host : 'zelana.org';
  const message = getDerivationMessage(domain);
  const messageBytes = new TextEncoder().encode(message);
  
  // Sign the message
  const result = await wallet.signMessage({ message: messageBytes });
  
  // Extract signature bytes
  let signatureBytes: Uint8Array;
  if (result instanceof Uint8Array) {
    signatureBytes = result;
  } else if (result && typeof result === 'object' && 'signature' in result) {
    const sig = result.signature;
    if (sig instanceof Uint8Array) {
      signatureBytes = sig;
    } else if (typeof sig === 'string') {
      // Decode base58 signature
      const { base58ToBytes } = await import('@zelana/sdk');
      signatureBytes = base58ToBytes(sig);
    } else {
      throw new Error('Unexpected signature format');
    }
  } else {
    throw new Error('Failed to get signature');
  }
  
  // Hash the signature to get a 32-byte seed
  const seed = sha256(signatureBytes);
  
  // Create keypair from seed
  return Keypair.fromSecretKey(seed);
}

/**
 * Persisted keypair data structure
 */
interface PersistedKeypair {
  version: number;
  walletAddress: string;  // The L1 wallet address that derived this keypair
  secretKeyHex: string;   // The secret key in hex format
  timestamp: number;      // When the keypair was derived
}

/**
 * Persist a keypair to localStorage.
 * 
 * @param keypair - The keypair to persist
 * @param walletAddress - The L1 wallet address that derived this keypair
 */
export function persistKeypair(keypair: Keypair, walletAddress: string): void {
  if (typeof localStorage === 'undefined') return;
  
  const data: PersistedKeypair = {
    version: STORAGE_VERSION,
    walletAddress,
    secretKeyHex: keypair.secretKeyHex,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist L2 keypair:', e);
  }
}

/**
 * Load a persisted keypair from localStorage.
 * Returns null if no keypair is stored or if it was derived from a different wallet.
 * 
 * @param walletAddress - The current L1 wallet address
 * @returns The stored keypair or null
 */
export function loadPersistedKeypair(walletAddress: string): Keypair | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data: PersistedKeypair = JSON.parse(stored);
    
    // Check version
    if (data.version !== STORAGE_VERSION) {
      clearPersistedKeypair();
      return null;
    }
    
    // Check wallet address matches
    if (data.walletAddress !== walletAddress) {
      // Different wallet, clear the old keypair
      clearPersistedKeypair();
      return null;
    }
    
    // Restore keypair
    return Keypair.fromHex(data.secretKeyHex);
  } catch (e) {
    console.warn('Failed to load persisted L2 keypair:', e);
    clearPersistedKeypair();
    return null;
  }
}

/**
 * Clear the persisted keypair from localStorage.
 */
export function clearPersistedKeypair(): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear persisted L2 keypair:', e);
  }
}

/**
 * Check if a keypair is persisted for the given wallet.
 */
export function hasPersistedKeypair(walletAddress: string): boolean {
  return loadPersistedKeypair(walletAddress) !== null;
}
