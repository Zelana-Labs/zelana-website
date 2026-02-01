/**
 * Ownership Prover - WASM wrapper for shielded transaction proofs
 * 
 * This module provides client-side computation of ownership witnesses
 * for shielded transfers using MiMC hashing (matching Noir circuits).
 */

// WASM module types
interface WasmModule {
  derivePublicKey(spending_key_hex: string): string;
  computeCommitment(owner_pk_hex: string, value: bigint, blinding_hex: string): string;
  computeNullifier(spending_key_hex: string, commitment_hex: string, position: bigint): string;
  computeBlindedProxy(commitment_hex: string, position: bigint): string;
  generateWitness(spending_key_hex: string, value: bigint, blinding_hex: string, position: bigint): WitnessResult;
  init_panic_hook(): void;
}

interface WitnessResult {
  ownerPk: string;
  commitment: string;
  nullifier: string;
  blindedProxy: string;
}

export interface OwnershipWitness {
  ownerPk: string;
  commitment: string;
  nullifier: string;
  blindedProxy: string;
  // Original inputs (needed for proof generation)
  spendingKey: string;
  value: bigint;
  blinding: string;
  position: bigint;
}

// Singleton WASM module instance
let wasmModule: WasmModule | null = null;
let initPromise: Promise<WasmModule> | null = null;

/**
 * Initialize the WASM ownership prover
 * 
 * This loads the WASM module from /wasm/zelana_ownership_prover_bg.wasm
 * and caches it for subsequent calls.
 */
export async function initOwnershipProver(): Promise<WasmModule> {
  if (wasmModule) {
    return wasmModule;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      // Dynamic import of the WASM JS wrapper
      const wasm = await import('./wasm/zelana_ownership_prover.js');
      
      // Initialize WASM with the binary file path
      await wasm.default('/wasm/zelana_ownership_prover_bg.wasm');
      
      // Initialize panic hook for better error messages
      wasm.init_panic_hook();
      
      wasmModule = wasm as unknown as WasmModule;
      return wasmModule;
    } catch (error) {
      initPromise = null;
      throw new Error(`Failed to initialize ownership prover: ${error}`);
    }
  })();
  
  return initPromise;
}

/**
 * Check if the ownership prover is initialized
 */
export function isProverInitialized(): boolean {
  return wasmModule !== null;
}

/**
 * Generate random 32-byte hex string for blinding factor
 */
export function generateBlinding(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Compute ownership witness for a shielded note
 * 
 * This computes all the cryptographic values needed for an ownership proof:
 * - owner public key (derived from spending key)
 * - commitment (hiding the note value)
 * - nullifier (unique identifier when spending)
 * - blinded proxy (for delegation)
 * 
 * @param spendingKeyHex - 32-byte spending key as hex
 * @param value - Note value in lamports
 * @param blindingHex - 32-byte random blinding factor as hex
 * @param position - Note position in the commitment tree
 * @returns Complete ownership witness
 */
export async function computeOwnershipWitness(
  spendingKeyHex: string,
  value: bigint,
  blindingHex: string,
  position: bigint
): Promise<OwnershipWitness> {
  const wasm = await initOwnershipProver();
  
  const result = wasm.generateWitness(spendingKeyHex, value, blindingHex, position);
  
  return {
    ownerPk: result.ownerPk,
    commitment: result.commitment,
    nullifier: result.nullifier,
    blindedProxy: result.blindedProxy,
    spendingKey: spendingKeyHex,
    value,
    blinding: blindingHex,
    position,
  };
}

/**
 * Derive public key from spending key
 * 
 * Uses MiMC hash to derive the public key, matching the Noir circuit.
 */
export async function derivePublicKey(spendingKeyHex: string): Promise<string> {
  const wasm = await initOwnershipProver();
  return wasm.derivePublicKey(spendingKeyHex);
}

/**
 * Compute note commitment
 * 
 * commitment = MiMC(ownerPk, value, blinding)
 */
export async function computeCommitment(
  ownerPkHex: string,
  value: bigint,
  blindingHex: string
): Promise<string> {
  const wasm = await initOwnershipProver();
  return wasm.computeCommitment(ownerPkHex, value, blindingHex);
}

/**
 * Compute nullifier for a note
 * 
 * nullifier = MiMC(spendingKey, commitment, position)
 */
export async function computeNullifier(
  spendingKeyHex: string,
  commitmentHex: string,
  position: bigint
): Promise<string> {
  const wasm = await initOwnershipProver();
  return wasm.computeNullifier(spendingKeyHex, commitmentHex, position);
}

/**
 * Compute blinded proxy for delegation
 * 
 * blindedProxy = MiMC(commitment, position)
 */
export async function computeBlindedProxy(
  commitmentHex: string,
  position: bigint
): Promise<string> {
  const wasm = await initOwnershipProver();
  return wasm.computeBlindedProxy(commitmentHex, position);
}
