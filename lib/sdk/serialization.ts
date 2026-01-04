// lib/zelana-serialization.ts - Binary serialization helpers matching Rust wincode format

/**
 * Wincode-style binary serialization utilities
 * These match the Rust serialization format used by the Zelana sequencer
 */

export class BinaryWriter {
    private buffer: number[] = [];

    writeU8(value: number): void {
        this.buffer.push(value & 0xFF);
    }

    writeU32(value: number): void {
        // Little-endian u32
        this.buffer.push(value & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push((value >> 16) & 0xFF);
        this.buffer.push((value >> 24) & 0xFF);
    }

    writeU64(value: bigint): void {
        // Little-endian u64
        for (let i = 0; i < 8; i++) {
            this.buffer.push(Number((value >> BigInt(i * 8)) & BigInt(0xFF)));
        }
    }

    writeBytes(bytes: Uint8Array): void {
        this.buffer.push(...bytes);
    }

    writeVec(items: Uint8Array): void {
        // Write length as u64 (wincode format for Vec)
        this.writeU64(BigInt(items.length));
        this.writeBytes(items);
    }

    toUint8Array(): Uint8Array {
        // Create with explicit ArrayBuffer to ensure correct typing
        const buffer = new ArrayBuffer(this.buffer.length);
        const view = new Uint8Array(buffer);
        view.set(this.buffer);
        return view;
    }
}

export interface TransactionData {
    from: Uint8Array;    // 32 bytes
    to: Uint8Array;      // 32 bytes  
    amount: number;      // u64
    nonce: number;       // u64
    chainId: number;     // u64
}

export interface SignedTransaction {
    txData: TransactionData;
    signature: Uint8Array; // 64 bytes
    signerPubkey: Uint8Array; // 32 bytes - the public key of the signer
}

export interface Transaction {
    txType: 'Transfer';
    signedTx: SignedTransaction;
    sender: Uint8Array; // 32 bytes (Pubkey)
    signature: Uint8Array; // 64 bytes (top-level signature field)
}

/**
 * Serialize TransactionData matching Rust struct
 */
export function serializeTransactionData(data: TransactionData): Uint8Array {
    const writer = new BinaryWriter();

    // Fields in order: from, to, amount, nonce, chain_id
    writer.writeBytes(data.from);     // 32 bytes
    writer.writeBytes(data.to);       // 32 bytes
    writer.writeU64(BigInt(data.amount));
    writer.writeU64(BigInt(data.nonce));
    writer.writeU64(BigInt(data.chainId));

    return writer.toUint8Array();
}

/**
 * Serialize SignedTransaction matching Rust struct
 * 
 * Rust structure:
 * struct SignedTransaction {
 *     data: TransactionData,
 *     signature: Signature,
 *     signer_pubkey: Pubkey,  ← Don't forget this!
 * }
 */
export function serializeSignedTransaction(signedTx: SignedTransaction): Uint8Array {
    const writer = new BinaryWriter();

    // Field 1: data (TransactionData - 88 bytes)
    const txDataBytes = serializeTransactionData(signedTx.txData);
    writer.writeBytes(txDataBytes);

    // Field 2: signature (64 bytes)
    writer.writeBytes(signedTx.signature);

    // Field 3: signer_pubkey (32 bytes) ← This was missing!
    writer.writeBytes(signedTx.signerPubkey);

    return writer.toUint8Array();
}

/**
 * Serialize complete Transaction matching Rust struct field order
 * 
 * Rust structure:
 * struct Transaction {
 *     sender: Pubkey,             // FIRST - 32 bytes
 *     tx_type: TransactionType,   // SECOND - enum (variant + data)
 *     signature: Signature,       // THIRD - 64 bytes
 * }
 * 
 * enum TransactionType {
 *     Shielded = 0,
 *     Transfer = 1,  ← We use this
 *     Deposit = 2,
 *     Withdraw = 3,
 * }
 */
export function serializeTransaction(tx: Transaction): Uint8Array {
    const writer = new BinaryWriter();

    // FIELD 1: sender (32 bytes) - must come FIRST
    writer.writeBytes(tx.sender);

    // FIELD 2: tx_type (enum TransactionType::Transfer)
    // Enum variant index for Transfer is 1 (not 0!)
    writer.writeU32(1);  // Transfer variant

    // Enum variant data: SignedTransaction
    const signedTxBytes = serializeSignedTransaction(tx.signedTx);
    writer.writeBytes(signedTxBytes);

    // FIELD 3: signature (64 bytes) - top-level signature
    writer.writeBytes(tx.signature);

    return writer.toUint8Array();
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
    const clean = hex.replace(/^0x/, '');
    if (!/^[0-9a-fA-F]*$/.test(clean)) {
        throw new Error("Invalid hex string");
    }
    if (clean.length % 2 !== 0) {
        throw new Error("Hex string must have even length");
    }

    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
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