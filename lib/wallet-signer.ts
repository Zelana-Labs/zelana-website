/**
 * Wallet Signer
 * 
 * Implements the Signer interface using a Solana wallet.
 * This allows using the Solana wallet's Ed25519 keypair directly for L2 signing,
 * which means the L2 address is the same as the L1 Solana address.
 * 
 * Uses human-readable text messages for signing to avoid Phantom/Privy
 * detecting the message as a Solana transaction and blocking it.
 */

import type { Signer, Bytes32, TransferRequest, WithdrawRequest } from '@zelana/sdk';
import { bytesToHex, bytesToBase58, base58ToBytes } from '@zelana/sdk';

/**
 * Interface for a wallet that can sign messages
 */
export interface SignableWallet {
  address: string;
  signMessage: (args: { message: Uint8Array }) => Promise<
    | { signature: Uint8Array | string }
    | Uint8Array
  >;
}

/**
 * Build a human-readable transfer message for signing.
 * 
 * This format:
 * 1. Is obviously NOT a Solana transaction (prevents Phantom blocking)
 * 2. Users can read what they're signing (good UX)
 * 3. Similar to EIP-712 on Ethereum
 * 
 * IMPORTANT: The Rust sequencer must build the EXACT same message to verify.
 */
function buildTransferMessage(
  from: Uint8Array,
  to: Uint8Array,
  amount: bigint,
  nonce: bigint,
  chainId: bigint
): string {
  return `Zelana L2 Transfer

From: ${bytesToHex(from)}
To: ${bytesToHex(to)}
Amount: ${amount.toString()} lamports
Nonce: ${nonce.toString()}
Chain ID: ${chainId.toString()}

Sign to authorize this L2 transfer.`;
}

/**
 * Build a human-readable withdrawal message for signing.
 */
function buildWithdrawMessage(
  from: Uint8Array,
  toL1Address: Uint8Array,
  amount: bigint,
  nonce: bigint
): string {
  return `Zelana L2 Withdrawal

From: ${bytesToHex(from)}
To L1: ${bytesToBase58(toL1Address)}
Amount: ${amount.toString()} lamports
Nonce: ${nonce.toString()}

Sign to authorize this withdrawal to Solana L1.`;
}

/**
 * WalletSigner implements the Signer interface using a Solana wallet.
 * 
 * The L2 address is the hex-encoded Solana public key, ensuring that:
 * - Deposits go to the correct L2 address (based on L1 pubkey)
 * - Transfers and withdrawals use the same address
 * 
 * @example
 * ```typescript
 * const signer = new WalletSigner(solanaWallet);
 * const client = new ZelanaClient({
 *   baseUrl: 'http://localhost:8080',
 *   signer,
 * });
 * 
 * // Now the L2 address matches where deposits go!
 * const result = await client.transfer(recipient, amount);
 * ```
 */
export class WalletSigner implements Signer {
  private readonly wallet: SignableWallet;
  private readonly _publicKey: Uint8Array;

  constructor(wallet: SignableWallet) {
    this.wallet = wallet;
    // Decode the Solana address (base58) to get the public key bytes
    this._publicKey = base58ToBytes(wallet.address);
    
    if (this._publicKey.length !== 32) {
      throw new Error(`Invalid wallet address: expected 32 bytes, got ${this._publicKey.length}`);
    }
  }

  /**
   * Get the public key as 32 bytes
   */
  get publicKey(): Bytes32 {
    return new Uint8Array(this._publicKey);
  }

  /**
   * Get the public key as hex string (L2 address format)
   */
  get publicKeyHex(): string {
    return bytesToHex(this._publicKey);
  }

  /**
   * Get the public key as base58 (Solana format)
   */
  get publicKeyBase58(): string {
    return bytesToBase58(this._publicKey);
  }

  /**
   * Sign a message using the Solana wallet
   */
  async sign(message: Uint8Array): Promise<Uint8Array> {
    const result = await this.wallet.signMessage({ message });
    
    // Extract signature bytes from the result
    if (result instanceof Uint8Array) {
      return result;
    }
    
    if (result && typeof result === 'object' && 'signature' in result) {
      const sig = result.signature;
      if (sig instanceof Uint8Array) {
        return sig;
      }
      if (typeof sig === 'string') {
        // Decode base58 signature
        return base58ToBytes(sig);
      }
    }
    
    throw new Error('Failed to get signature from wallet');
  }

  /**
   * Sign a transfer transaction using human-readable text format.
   * 
   * The message is a human-readable text string that the user can read,
   * which prevents Phantom/Privy from blocking it as a Solana transaction.
   */
  async signTransfer(
    to: Bytes32,
    amount: bigint,
    nonce: bigint,
    chainId: bigint = BigInt(1)
  ): Promise<TransferRequest> {
    // Build human-readable message
    const messageText = buildTransferMessage(
      this._publicKey,
      to,
      amount,
      nonce,
      chainId
    );

    // Convert to UTF-8 bytes for signing
    const message = new TextEncoder().encode(messageText);
    const signature = await this.sign(message);

    return {
      from: this.publicKey,
      to: new Uint8Array(to),
      amount,
      nonce,
      chainId,
      signature,
      signerPubkey: this.publicKey
    };
  }

  /**
   * Sign a withdrawal request using human-readable text format.
   */
  async signWithdrawal(
    toL1Address: Bytes32,
    amount: bigint,
    nonce: bigint
  ): Promise<WithdrawRequest> {
    // Build human-readable message
    const messageText = buildWithdrawMessage(
      this._publicKey,
      toL1Address,
      amount,
      nonce
    );

    // Convert to UTF-8 bytes for signing
    const message = new TextEncoder().encode(messageText);
    const signature = await this.sign(message);

    return {
      from: this.publicKey,
      toL1Address: new Uint8Array(toL1Address),
      amount,
      nonce,
      signature,
      signerPubkey: this.publicKey
    };
  }
}
