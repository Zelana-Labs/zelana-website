/**
 * Noir Prover - Browser-based ZK proof generation for ownership proofs
 * 
 * This module uses @noir-lang/noir_js and @aztec/bb.js to generate
 * real ZK proofs in the browser for shielded transactions.
 * 
 * The ownership circuit proves:
 * 1. User knows the spending key for a note
 * 2. The commitment is correctly computed
 * 3. The nullifier is correctly derived
 * 4. The blinded proxy is correctly computed
 */

import { Noir } from '@noir-lang/noir_js';
import type { CompiledCircuit } from '@noir-lang/types';
import { UltraHonkBackend } from '@aztec/bb.js';

// Circuit JSON will be loaded dynamically
let circuitJson: CompiledCircuit | null = null;
let noir: Noir | null = null;
let backend: UltraHonkBackend | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Noir prover with the ownership circuit
 * 
 * This loads the circuit JSON and initializes the proving backend.
 * First call may take 2-3 seconds as WASM modules are loaded.
 */
export async function initNoirProver(): Promise<void> {
  if (noir && backend) {
    return;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      // Load the compiled circuit JSON
      const response = await fetch('/circuits/ownership.json');
      if (!response.ok) {
        throw new Error(`Failed to load circuit: ${response.statusText}`);
      }
      circuitJson = await response.json() as CompiledCircuit;
      
      // Initialize the Noir instance with the circuit
      noir = new Noir(circuitJson);
      
      // Initialize the UltraHonk backend for proving
      backend = new UltraHonkBackend(circuitJson.bytecode);
      
      console.log('[NoirProver] Initialized ownership circuit');
    } catch (error) {
      initPromise = null;
      throw new Error(`Failed to initialize Noir prover: ${error}`);
    }
  })();
  
  return initPromise;
}

/**
 * Check if the Noir prover is initialized
 */
export function isNoirProverInitialized(): boolean {
  return noir !== null && backend !== null;
}

/**
 * Input type for ownership proof
 */
export interface OwnershipProofInput {
  /** Spending key (private) - decimal string */
  spendingKey: string;
  /** Note value in lamports (private) - decimal string */
  noteValue: string;
  /** Note blinding factor (private) - decimal string */
  noteBlinding: string;
  /** Note position in tree (private) - decimal string */
  notePosition: string;
  /** Expected commitment (public) - decimal string */
  commitment: string;
  /** Expected nullifier (public) - decimal string */
  nullifier: string;
  /** Expected blinded proxy (public) - decimal string */
  blindedProxy: string;
}

/**
 * Result of proof generation
 */
export interface OwnershipProofResult {
  /** The ZK proof bytes */
  proof: Uint8Array;
  /** Public inputs that were verified */
  publicInputs: {
    commitment: string;
    nullifier: string;
    blindedProxy: string;
  };
  /** Time taken to generate the proof (ms) */
  provingTimeMs: number;
}

/**
 * Generate an ownership proof
 * 
 * This proves that the user knows the spending key for a note without
 * revealing the spending key. The proof can be verified by anyone.
 * 
 * @param input - The proof inputs (private and public)
 * @returns The generated proof and public inputs
 * 
 * @example
 * ```typescript
 * const proof = await generateOwnershipProof({
 *   spendingKey: "12345",
 *   noteValue: "1000000000",
 *   noteBlinding: "9999999",
 *   notePosition: "0",
 *   commitment: "2849525082413391935205414809395843502999068465553669906610456805614249420778",
 *   nullifier: "14691736698649923310194666313044300559018254587919179583564281212749516230318",
 *   blindedProxy: "3477303148080158299689369694437718872116602033803139479526774625246023429220"
 * });
 * ```
 */
export async function generateOwnershipProof(
  input: OwnershipProofInput
): Promise<OwnershipProofResult> {
  await initNoirProver();
  
  if (!noir || !backend) {
    throw new Error('Noir prover not initialized');
  }
  
  const startTime = performance.now();
  
  // Convert inputs to the format expected by the circuit
  // The circuit expects Field elements as strings
  const circuitInput = {
    // Private inputs
    spending_key: input.spendingKey,
    note_value: input.noteValue,
    note_blinding: input.noteBlinding,
    note_position: input.notePosition,
    // Public inputs
    commitment: input.commitment,
    nullifier: input.nullifier,
    blinded_proxy: input.blindedProxy,
  };
  
  try {
    // Generate the witness (executes the circuit)
    const { witness } = await noir.execute(circuitInput);
    
    // Generate the proof using UltraHonk
    const proof = await backend.generateProof(witness);
    
    const provingTimeMs = performance.now() - startTime;
    
    console.log(`[NoirProver] Generated proof in ${provingTimeMs.toFixed(0)}ms`);
    
    return {
      proof: proof.proof,
      publicInputs: {
        commitment: input.commitment,
        nullifier: input.nullifier,
        blindedProxy: input.blindedProxy,
      },
      provingTimeMs,
    };
  } catch (error) {
    throw new Error(`Proof generation failed: ${error}`);
  }
}

/**
 * Verify an ownership proof
 * 
 * This verifies that a proof is valid for the given public inputs.
 * Note: In production, verification happens on the sequencer/L1.
 * This is mainly for testing/debugging.
 * 
 * @param proof - The proof bytes
 * @param publicInputs - The public inputs
 * @returns true if the proof is valid
 */
export async function verifyOwnershipProof(
  proof: Uint8Array,
  publicInputs: {
    commitment: string;
    nullifier: string;
    blindedProxy: string;
  }
): Promise<boolean> {
  await initNoirProver();
  
  if (!backend) {
    throw new Error('Noir prover not initialized');
  }
  
  try {
    // The public inputs need to be in the format expected by the verifier
    // For UltraHonk, we pass them as an array of hex strings
    const publicInputsArray = [
      publicInputs.commitment,
      publicInputs.nullifier,
      publicInputs.blindedProxy,
    ];
    
    const isValid = await backend.verifyProof({
      proof,
      publicInputs: publicInputsArray,
    });
    
    return isValid;
  } catch (error) {
    console.error('[NoirProver] Verification failed:', error);
    return false;
  }
}

/**
 * Get the verification key for the ownership circuit
 * 
 * This can be used by the backend to verify proofs without
 * needing the full circuit.
 */
export async function getVerificationKey(): Promise<Uint8Array> {
  await initNoirProver();
  
  if (!backend) {
    throw new Error('Noir prover not initialized');
  }
  
  return backend.getVerificationKey();
}

/**
 * Convert a decimal string to a field-compatible string
 * 
 * Noir uses Field elements which are 254-bit numbers.
 * This ensures the input is properly formatted.
 */
export function toFieldString(value: bigint | string | number): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return Math.floor(value).toString();
  }
  // Already a string, clean it up
  const clean = value.trim();
  if (clean.startsWith('0x')) {
    // Convert hex to decimal
    return BigInt(clean).toString();
  }
  return clean;
}

/**
 * Convert a 32-byte hex string to a decimal field string
 * 
 * This is useful for converting commitment/nullifier bytes to field elements.
 */
export function hexToFieldString(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + clean).toString();
}

/**
 * Convert a decimal field string to a 32-byte Uint8Array
 * 
 * This is useful for converting field elements back to bytes for submission.
 */
export function fieldStringToBytes(field: string): Uint8Array {
  const bigint = BigInt(field);
  const hex = bigint.toString(16).padStart(64, '0');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
