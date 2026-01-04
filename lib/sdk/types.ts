// lib/types.ts - Types matching the Rust backend structures

import { ConnectedStandardSolanaWallet } from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";

/**
 * AccountId - 32-byte identifier for L2 accounts
 */
export interface AccountId {
  bytes: Uint8Array; // 32 bytes
}

/**
 * Pubkey - 32-byte Ed25519 public key
 */
export interface Pubkey {
  bytes: Uint8Array; // 32 bytes
}

/**
 * Signature - 64-byte Ed25519 signature
 */
export interface Signature {
  bytes: Uint8Array; // 64 bytes
}

/**
 * TransactionData - The payload that gets signed
 */
export interface TransactionData {
  from: AccountId;
  to: AccountId;
  amount: bigint;
  nonce: bigint;
  chain_id: bigint;
}

export interface ZelanaTransactionParams {
  senderPublicKey: PublicKey;
  recipientAddress: string; // 64 hex chars (32 bytes)
  amount: number;
  nonce: number;
  chainId: number;
  // Privy wallet for signing
  privyWallet: ConnectedStandardSolanaWallet;
}

export interface ZelanaTransactionResult {
  success: boolean;
  message?: string;
  txHash?: string;
  error?: string;
}

/**
 * SignedTransaction - The authenticated wrapper
 */
export interface SignedTransaction {
  data: TransactionData;
  signature: Signature;
  signer_pubkey: Pubkey;
}

/**
 * TransactionType enum
 */
export enum TransactionTypeKind {
  Shielded = 0,
  Transfer = 1,
  Deposit = 2,
  Withdraw = 3,
}

/**
 * TransactionTypeData - Union type for different transaction data
 */
export type TransactionTypeData = SignedTransaction | Record<string, unknown>;

/**
 * TransactionType - The type and data for a transaction
 */
export interface TransactionType {
  kind: TransactionTypeKind;
  data: TransactionTypeData;
}

/**
 * Transaction - The complete transaction structure sent to the sequencer
 */
export interface Transaction {
  sender: Pubkey;
  tx_type: TransactionType;
  signature: Signature;
}

/**
 * Helper to create AccountId from hex string or PublicKey
 */
export function createAccountId(pubkey: Uint8Array): AccountId {
  if (pubkey.length !== 32) {
    throw new Error(`Invalid pubkey length: expected 32, got ${pubkey.length}`);
  }
  return { bytes: pubkey };
}

/**
 * Helper to create Pubkey from Uint8Array
 */
export function createPubkey(bytes: Uint8Array): Pubkey {
  if (bytes.length !== 32) {
    throw new Error(`Invalid pubkey length: expected 32, got ${bytes.length}`);
  }
  return { bytes };
}

/**
 * Helper to create Signature from Uint8Array
 */
export function createSignature(bytes: Uint8Array): Signature {
  if (bytes.length !== 64) {
    throw new Error(`Invalid signature length: expected 64, got ${bytes.length}`);
  }
  return { bytes };
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}