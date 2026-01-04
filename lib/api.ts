// lib/api.ts - Zelana L2 Transaction API with Privy Support

import { PublicKey } from "@solana/web3.js";
import {
    serializeTransaction,
    hexToBytes,
    bytesToHex,
    type TransactionData,
    type Transaction,
} from "./sdk/serialization";
import type { ConnectedStandardSolanaWallet } from "@privy-io/react-auth/solana";
import { ZelanaTransactionParams, ZelanaTransactionResult } from "./sdk/types";


/**
 * Derive L2 account ID from Solana public key
 */
function deriveAccountId(publicKey: PublicKey): Uint8Array {
    return publicKey.toBytes();
}

/**
 * Sign message using Privy Solana wallet
 * 
 * The ConnectedStandardSolanaWallet.signMessage expects an object:
 * { message: Uint8Array }
 */
async function signWithPrivy(
    wallet: ConnectedStandardSolanaWallet,
    message: Uint8Array
): Promise<Uint8Array> {
    try {
        // Privy expects { message: Uint8Array } not just Uint8Array
        const result = await wallet.signMessage({ message });

        // The result is SolanaSignMessageOutput which has a signature property
        // signature is a Uint8Array
        if (result && typeof result === 'object' && 'signature' in result) {
            const sig = result.signature;

            if (sig instanceof Uint8Array) {
                return sig;
            }

            // If it's a base58 string
            if (typeof sig === 'string') {
                const bs58 = await import('bs58');
                return bs58.default.decode(sig);
            }
        }

        // Fallback: if result itself is Uint8Array
        if (result instanceof Uint8Array) {
            return result;
        }

        throw new Error('Unexpected signature format from Privy wallet');
    } catch (error) {
        console.error('Error signing with Privy wallet:', error);
        throw error;
    }
}

/**
 * Submit a Zelana L2 transaction to the sequencer
 * 
 * This function:
 * 1. Creates the transaction data structure
 * 2. Signs it using the Privy Solana wallet
 * 3. Serializes using wincode-compatible format
 * 4. Submits to the sequencer via HTTP POST
 */
export async function submitZelanaTransaction(
    params: ZelanaTransactionParams
): Promise<ZelanaTransactionResult> {
    try {
        // ===== VALIDATION =====

        if (!params.privyWallet) {
            throw new Error("No wallet connected. Please connect your Solana wallet via Privy.");
        }

        // Validate and parse recipient address
        const recipientBytes = hexToBytes(params.recipientAddress);
        if (recipientBytes.length !== 32) {
            throw new Error("Recipient address must be exactly 32 bytes (64 hex chars)");
        }

        // Validate amounts
        if (params.amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
        if (params.nonce < 0) {
            throw new Error("Nonce must be non-negative");
        }

        console.log("📝 Creating transaction...");
        console.log("  Wallet Type: Privy");
        console.log("  From:", params.senderPublicKey.toString());
        console.log("  To:", params.recipientAddress);
        console.log("  Amount:", params.amount);
        console.log("  Nonce:", params.nonce);

        // ===== DERIVE ACCOUNT IDS =====

        const senderAccountId = deriveAccountId(params.senderPublicKey);
        console.log("  Sender Account ID:", bytesToHex(senderAccountId));

        // ===== CREATE TRANSACTION DATA =====

        const txData: TransactionData = {
            from: senderAccountId,
            to: recipientBytes,
            amount: params.amount,
            nonce: params.nonce,
            chainId: params.chainId,
        };

        // Serialize for signing
        const { serializeTransactionData } = await import("./sdk/serialization");
        const txDataBytes = serializeTransactionData(txData);

        console.log("  Transaction data size:", txDataBytes.length, "bytes");

        // ===== SIGN TRANSACTION =====

        console.log("✍️  Requesting signature from wallet...");

        const signature = await signWithPrivy(params.privyWallet, txDataBytes);

        if (signature.length !== 64) {
            throw new Error(`Invalid signature length: expected 64 bytes, got ${signature.length}`);
        }

        console.log("  Signature:", bytesToHex(signature).substring(0, 32) + "...");

        // ===== BUILD COMPLETE TRANSACTION =====

        const transaction: Transaction = {
            txType: 'Transfer',
            signedTx: {
                txData,
                signature,
                signerPubkey: params.senderPublicKey.toBytes(), // Add signer pubkey
            },
            sender: params.senderPublicKey.toBytes(),
            signature: signature, // Top-level signature field (same as in signedTx)
        };

        // ===== SERIALIZE TRANSACTION =====

        const serializedTx = serializeTransaction(transaction);
        console.log("📦 Serialized transaction size:", serializedTx.length, "bytes (expected: 284)");

        // ===== SUBMIT TO SEQUENCER =====

        console.log("🚀 Submitting to sequencer...");

        // Create a plain Uint8Array with explicit ArrayBuffer
        const buffer = new ArrayBuffer(serializedTx.length);
        const dataToSend = new Uint8Array(buffer);
        dataToSend.set(serializedTx);

        const response = await fetch("http://localhost:8080/submit_tx", {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
            },
            body: dataToSend,
        });

        const responseText = await response.text();

        console.log("  Status:", response.status);
        console.log("  Response:", responseText);

        // ===== HANDLE RESPONSE =====

        if (response.ok) {
            const txHash = bytesToHex(signature);
            return {
                success: true,
                message: responseText || "Transaction submitted successfully",
                txHash: `${txHash}`,
            };
        } else {
            return {
                success: false,
                error: `Sequencer returned ${response.status}: ${responseText}`,
            };
        }

    } catch (error) {
        console.error("❌ Transaction submission error:", error);

        // Provide helpful error messages
        let errorMessage = "Unknown error occurred";

        if (error instanceof Error) {
            errorMessage = error.message;

            // Enhance common errors
            if (errorMessage.includes("User rejected") || errorMessage.includes("rejected")) {
                errorMessage = "Transaction signature was rejected by user";
            } else if (errorMessage.includes("Failed to fetch")) {
                errorMessage = "Could not connect to sequencer. Is it running on localhost:8080?";
            } else if (errorMessage.includes("insufficient funds")) {
                errorMessage = "Insufficient funds for transaction";
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

export type { ZelanaTransactionParams };
