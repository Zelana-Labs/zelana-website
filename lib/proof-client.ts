/**
 * Proof Client - Server-side proof generation via prover-coordinator
 *
 * This module provides a client for generating Groth16 proofs on the server
 * using the prover-coordinator's ownership proof endpoint.
 *
 * Benefits over browser-based proving:
 * - Faster proving (native code vs WASM)
 * - Smaller client bundle (no bb.js)
 * - Consistent proof format (Groth16 via Sunspot)
 * - Proper verification on sequencer
 */

// Prover coordinator URL - defaults to local development
const PROVER_COORDINATOR_URL =
  process.env.NEXT_PUBLIC_PROVER_URL || "http://localhost:8080";

/**
 * Request type for ownership proof generation
 */
export interface OwnershipProofRequest {
  /** Spending key (decimal string) - secret */
  spending_key: string;
  /** Note value in lamports (decimal string) */
  note_value: string;
  /** Note blinding factor (decimal string) */
  note_blinding: string;
  /** Note position in tree (decimal string) */
  note_position: string;
  /** Expected commitment (decimal string) - public */
  commitment: string;
  /** Expected nullifier (decimal string) - public */
  nullifier: string;
  /** Expected blinded proxy (decimal string) - public */
  blinded_proxy: string;
}

/**
 * Response from ownership proof generation
 */
export interface OwnershipProofResponse {
  /** Groth16 proof bytes (hex encoded) */
  proof_bytes: string;
  /** Public witness bytes (hex encoded) */
  public_witness_bytes: string;
  /** Verified commitment */
  commitment: string;
  /** Verified nullifier */
  nullifier: string;
  /** Verified blinded proxy */
  blinded_proxy: string;
  /** Proving time in milliseconds */
  proving_time_ms: number;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

/**
 * Generate an ownership proof using the prover-coordinator
 *
 * This sends the proof request to the server, which generates a Groth16 proof
 * using nargo + sunspot. The proof can then be verified by the sequencer.
 *
 * @param request - The proof request with private and public inputs
 * @returns The generated proof and public witness
 * @throws Error if proof generation fails
 *
 * @example
 * ```typescript
 * const result = await generateOwnershipProof({
 *   spending_key: "12345",
 *   note_value: "1000000000",
 *   note_blinding: "9999999",
 *   note_position: "0",
 *   commitment: "2849525082413391935...",
 *   nullifier: "14691736698649923310...",
 *   blinded_proxy: "3477303148080158299...",
 * });
 * console.log(`Proof generated in ${result.proving_time_ms}ms`);
 * ```
 */
export async function generateOwnershipProof(
  request: OwnershipProofRequest
): Promise<OwnershipProofResponse> {
  const url = `${PROVER_COORDINATOR_URL}/v2/ownership/prove`;

  console.log("[ProofClient] Requesting ownership proof from server...");
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Proof request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result: ApiResponse<OwnershipProofResponse> = await response.json();

    if (result.status === "error") {
      throw new Error(`Proof generation failed: ${result.message}`);
    }

    if (!result.data) {
      throw new Error("No proof data in response");
    }

    const totalTime = performance.now() - startTime;
    console.log(
      `[ProofClient] Proof received in ${totalTime.toFixed(0)}ms (server proving: ${result.data.proving_time_ms}ms)`
    );

    return result.data;
  } catch (error) {
    console.error("[ProofClient] Failed to generate proof:", error);
    throw error;
  }
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Check if the prover-coordinator is healthy
 */
export async function checkProverHealth(): Promise<boolean> {
  try {
    const response = await fetch(
      `${PROVER_COORDINATOR_URL}/v2/ownership/health`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Convert a bigint or number to a decimal string for proof inputs
 */
export function toDecimalString(value: bigint | number | string): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "number") {
    return Math.floor(value).toString();
  }
  // Already a string - clean it
  const clean = value.trim();
  if (clean.startsWith("0x")) {
    // Convert hex to decimal
    return BigInt(clean).toString();
  }
  return clean;
}

/**
 * Convert a 32-byte hex commitment/nullifier to a decimal field string
 */
export function hexToDecimalField(hex: string): string {
  const clean = hex.startsWith("0x") ? hex : "0x" + hex;
  return BigInt(clean).toString();
}
