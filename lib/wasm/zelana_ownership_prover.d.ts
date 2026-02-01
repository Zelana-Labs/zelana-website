/* tslint:disable */
/* eslint-disable */

/**
 * Compute blinded proxy for delegation
 *
 * @param commitment_hex - Note commitment as hex (32 bytes)
 * @param position - Note position in commitment tree (u64)
 * @returns Blinded proxy as hex string (32 bytes)
 */
export function computeBlindedProxy(commitment_hex: string, position: bigint): string;

/**
 * Compute note commitment
 *
 * @param owner_pk_hex - Owner's public key as hex (32 bytes)
 * @param value - Note value in lamports (u64)
 * @param blinding_hex - Random blinding factor as hex (32 bytes)
 * @returns Commitment as hex string (32 bytes)
 */
export function computeCommitment(owner_pk_hex: string, value: bigint, blinding_hex: string): string;

/**
 * Compute nullifier
 *
 * @param spending_key_hex - Spending key as hex (32 bytes)
 * @param commitment_hex - Note commitment as hex (32 bytes)
 * @param position - Note position in commitment tree (u64)
 * @returns Nullifier as hex string (32 bytes)
 */
export function computeNullifier(spending_key_hex: string, commitment_hex: string, position: bigint): string;

/**
 * Derive public key from spending key
 *
 * @param spending_key_hex - 32-byte spending key as hex string
 * @returns Public key as hex string (32 bytes)
 */
export function derivePublicKey(spending_key_hex: string): string;

/**
 * Generate complete witness for ownership proof
 *
 * This computes all public outputs from the private inputs.
 *
 * @param spending_key_hex - Spending key as hex (32 bytes)
 * @param value - Note value in lamports (u64)
 * @param blinding_hex - Random blinding factor as hex (32 bytes)
 * @param position - Note position in commitment tree (u64)
 * @returns JSON object with commitment, nullifier, and blindedProxy
 */
export function generateWitness(spending_key_hex: string, value: bigint, blinding_hex: string, position: bigint): any;

/**
 * Initialize panic hook for better error messages in browser console
 */
export function init_panic_hook(): void;

/**
 * Verify that computed values match expected values
 *
 * This is useful for debugging before generating a proof.
 *
 * @param spending_key_hex - Spending key as hex (32 bytes)
 * @param value - Note value in lamports (u64)
 * @param blinding_hex - Random blinding factor as hex (32 bytes)
 * @param position - Note position in commitment tree (u64)
 * @param expected_commitment_hex - Expected commitment as hex (32 bytes)
 * @param expected_nullifier_hex - Expected nullifier as hex (32 bytes)
 * @param expected_proxy_hex - Expected blinded proxy as hex (32 bytes)
 * @returns true if all values match, false otherwise
 */
export function verifyWitness(spending_key_hex: string, value: bigint, blinding_hex: string, position: bigint, expected_commitment_hex: string, expected_nullifier_hex: string, expected_proxy_hex: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly derivePublicKey: (a: number, b: number) => [number, number, number, number];
  readonly computeCommitment: (a: number, b: number, c: bigint, d: number, e: number) => [number, number, number, number];
  readonly computeNullifier: (a: number, b: number, c: number, d: number, e: bigint) => [number, number, number, number];
  readonly computeBlindedProxy: (a: number, b: number, c: bigint) => [number, number, number, number];
  readonly generateWitness: (a: number, b: number, c: bigint, d: number, e: number, f: bigint) => [number, number, number];
  readonly verifyWitness: (a: number, b: number, c: bigint, d: number, e: number, f: bigint, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number, number];
  readonly init_panic_hook: () => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
