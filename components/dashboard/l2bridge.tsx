"use client";

import { useState, useEffect } from "react";
import {
    useWallets as useWalletsSolana,
    useSignAndSendTransaction,
} from "@privy-io/react-auth/solana";
import {
    address,
    appendTransactionMessageInstruction,
    compileTransaction,
    createSolanaRpc,
    createTransactionMessage,
    getBase64EncodedWireTransaction,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

// Your bridge program ID
const BRIDGE_PROGRAM_ID = "9HXapBN9otLGnQNGv1HRk91DGqMNvMAvQqohL7gPW1sd";

const SYSTEM_PROGRAM_ID = address(
    "11111111111111111111111111111111"
);

const DOMAIN = "solana";
const MIN_BALANCE_SOL = 2;

// Helper to convert L1 Solana pubkey to L2 AccountId (32 bytes hex)
function mapL1ToL2(walletAddress: string): string {
    const pubkey = new PublicKey(walletAddress);
    const bytes = pubkey.toBytes(); // Already 32 bytes
    // Convert to hex string
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Helper to serialize deposit params (matching Rust bincode)
function serializeDepositParams(amount: bigint, nonce: bigint): Uint8Array {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);

    // Write amount as u64 little-endian
    view.setBigUint64(0, amount, true);
    // Write nonce as u64 little-endian
    view.setBigUint64(8, nonce, true);

    return new Uint8Array(buffer);
}

// ----- Wallet Balance Component -----
interface WalletBalanceProps {
    walletAddress: string;
    connection: Connection;
}

function WalletBalance({ walletAddress, connection }: WalletBalanceProps) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!walletAddress) return;
            try {
                const bal = await connection.getBalance(new PublicKey(walletAddress));
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error("Failed to fetch balance:", err);
                setBalance(null);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, [walletAddress, connection]);

    return (
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-1">
                Wallet Balance
            </div>
            <div className="text-lg font-mono text-white/90">
                {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
            </div>
        </div>
    );
}

export function L2Bridge() {
    const { wallets } = useWalletsSolana();
    const { signAndSendTransaction } = useSignAndSendTransaction();

    const wallet = wallets[0];
    const [amount, setAmount] = useState("1.0");
    const [nonce, setNonce] = useState("101");
    const [sending, setSending] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);
    const [depositDetails, setDepositDetails] = useState<{
        amount: string;
        nonce: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const connection = new Connection("http://127.0.0.1:8899", "confirmed");

    // ----- AIRDROP -----
    const handleAirdrop = async () => {
        if (!wallet) {
            alert("No Solana wallet connected");
            return;
        }

        setSending(true);
        setError(null);

        try {
            const pubkey = new PublicKey(wallet.address);
            const currentBalance = await connection.getBalance(pubkey);
            
            if (currentBalance < MIN_BALANCE_SOL * LAMPORTS_PER_SOL) {
                const sig = await connection.requestAirdrop(
                    pubkey,
                    MIN_BALANCE_SOL * LAMPORTS_PER_SOL
                );
                await connection.confirmTransaction(sig, "confirmed");
                alert(`✅ Airdrop completed! Added ${MIN_BALANCE_SOL} SOL`);
            } else {
                alert(`You already have ${(currentBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            }
        } catch (err: unknown) {
            console.error("Airdrop error:", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(`Airdrop failed: ${errorMessage}`);
            alert("Airdrop failed: " + errorMessage);
        } finally {
            setSending(false);
        }
    };

    const deposit = async () => {
        if (!wallet) {
            alert("No Solana wallet connected");
            return;
        }

        try {
            setSending(true);
            setSignature(null);
            setDepositDetails(null);
            setError(null);

            const rpc = createSolanaRpc("http://127.0.0.1:8899");

            // Get latest blockhash
            const blockhashResponse = await rpc.getLatestBlockhash().send();
            const blockhash = blockhashResponse.value;

            // Wallet address
            const walletAddress = address(wallet.address);
            const walletPubkey = new PublicKey(wallet.address);

            // Prepare domain (padded to 32 bytes)
            const domainPadded = new Uint8Array(32);
            const domainBytes = new TextEncoder().encode(DOMAIN);
            domainPadded.set(domainBytes);

            // Derive PDAs using @solana/web3.js
            const programId = new PublicKey(BRIDGE_PROGRAM_ID);

            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config"), Buffer.from(domainPadded)],
                programId
            );

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), Buffer.from(domainPadded)],
                programId
            );

            // Prepare nonce bytes
            const nonceNum = BigInt(nonce);
            const nonceBytes = new Uint8Array(8);
            new DataView(nonceBytes.buffer).setBigUint64(0, nonceNum, true);

            const [receiptPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("receipt"),
                    Buffer.from(domainPadded),
                    walletPubkey.toBuffer(),
                    Buffer.from(nonceBytes),
                ],
                programId
            );

            console.log("📍 PDAs derived:");
            console.log("  Config:", configPda.toBase58());
            console.log("  Vault:", vaultPda.toBase58());
            console.log("  Receipt:", receiptPda.toBase58());

            // Convert amount to lamports (1 SOL = 1_000_000_000 lamports)
            const amountLamports = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));

            // Serialize deposit params
            const params = serializeDepositParams(amountLamports, nonceNum);

            // Instruction discriminator (1 for deposit) + serialized params
            const instructionData = new Uint8Array([1, ...params]);

            console.log("📦 Instruction data:", Array.from(instructionData));

            // Build deposit instruction
            // Account roles: 0 = readonly, 1 = writable, 2 = readonly+signer, 3 = writable+signer
            const depositInstruction = {
                programAddress: address(BRIDGE_PROGRAM_ID),
                accounts: [
                    { address: walletAddress, role: 3 }, // Payer (writable + signer)
                    { address: address(configPda.toBase58()), role: 0 }, // Config (readonly)
                    { address: address(vaultPda.toBase58()), role: 1 }, // Vault (writable)
                    { address: address(receiptPda.toBase58()), role: 1 }, // Receipt (writable)
                    { address: SYSTEM_PROGRAM_ID, role: 0 }, // System program (readonly)
                ],
                data: instructionData,
            };

            // Build transaction
            const transactionMessage = pipe(
                createTransactionMessage({ version: 0 }),
                (tx) => setTransactionMessageFeePayer(walletAddress, tx),
                (tx) => appendTransactionMessageInstruction(depositInstruction, tx),
                (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx)
            );

            const compiledTransaction = compileTransaction(transactionMessage);
            const base64Tx = getBase64EncodedWireTransaction(compiledTransaction);
            const transactionBuffer = Buffer.from(base64Tx, "base64");

            console.log("📤 Sending transaction...");

            // Sign and send with Privy
            const receipt = await signAndSendTransaction({
                wallet,
                transaction: transactionBuffer,
            });

            const sig =
                receipt.signature instanceof Uint8Array
                    ? bs58.encode(receipt.signature)
                    : receipt.signature;

            setSignature(sig);
            setDepositDetails({
                amount: amount,
                nonce: nonce,
            });

            console.log("✅ Deposit confirmed:", sig);
        } catch (err: unknown) {
            console.error("❌ Deposit failed:", err);

            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";

            if (errorMessage.includes("simulation failed")) {
                setError(
                    "Transaction simulation failed. Possible reasons:\n" +
                    "• Bridge not initialized\n" +
                    "• Insufficient SOL balance\n" +
                    "• Invalid nonce (already used)\n" +
                    "• Wrong cluster (check you're on devnet)"
                );
            } else if (errorMessage.includes("blockhash not found")) {
                setError("Blockhash expired. Please try again.");
            } else if (errorMessage.includes("insufficient funds")) {
                setError("Insufficient funds. You need SOL to cover the deposit amount plus transaction fees.");
            } else if (errorMessage.includes("AccountNotFound")) {
                setError("Bridge account not found. Make sure the bridge is initialized on devnet.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex gap-6 max-w-6xl mx-auto px-4">
            {/* LEFT: Controls */}
            <div className="space-y-4 w-[400px]">
                {/* Wallet Balance */}
                {wallet && (
                    <WalletBalance
                        walletAddress={wallet.address}
                        connection={connection}
                    />
                )}

                <div>
                    <label className="block text-sm text-white mb-1">
                        Amount (SOL)
                    </label>
                    <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1.0"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                        Minimum: 0.001 SOL
                    </p>
                </div>

                <div>
                    <label className="block text-sm text-white mb-1">
                        Nonce
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={nonce}
                        onChange={(e) => setNonce(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="101"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                        Must be unique for each deposit from your wallet
                    </p>
                </div>

                {/* Airdrop Button */}
                <button
                    onClick={handleAirdrop}
                    disabled={sending || !wallet}
                    className="w-full px-4 py-2 rounded bg-green-600 text-white font-medium disabled:opacity-40 hover:bg-green-700 transition-colors"
                >
                    {sending ? "Processing..." : "Airdrop SOL"}
                </button>

                {/* Deposit Button */}
                <button
                    onClick={deposit}
                    disabled={sending || !wallet || !amount || !nonce}
                    className="w-full px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                    {sending ? "Depositing…" : "Deposit to Bridge"}
                </button>

                {wallet && (
                    <div className="text-xs text-zinc-400 break-all space-y-2">
                        <div>
                            <div className="font-semibold mb-1">Connected Wallet (L1):</div>
                            <div className="font-mono text-purple-400">
                                {wallet.address}
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold mb-1">Your L2 Address:</div>
                            <div className="font-mono text-red-400">{mapL1ToL2(wallet.address)}</div>
                        </div>
                    </div>
                )}

                <div className="text-xs text-zinc-500 p-3 rounded bg-zinc-800 border border-zinc-700">
                    <div className="font-semibold mb-2">Bridge Configuration:</div>
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-400">Program:</span>
                            <div className="font-mono text-[10px] break-all mt-0.5">
                                {BRIDGE_PROGRAM_ID}
                            </div>
                        </div>
                        <div>
                            <span className="text-zinc-400">Domain:</span>
                            <span className="ml-1 font-mono">{DOMAIN}</span>
                        </div>
                        <div>
                            <span className="text-zinc-400">Cluster:</span>
                            <span className="ml-1 font-mono">devnet</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Terminal Output */}
            <div className="flex-1 pt-22 pb-22">
                <div className="h-full rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
                    {/* Terminal Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors"></div>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 ml-1">
                            bridge-terminal
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-6 font-mono text-xs overflow-auto max-h-[500px] min-h-[400px]">
                        {error && (
                            <div className="space-y-2">
                                <div className="text-red-400 flex items-center gap-2">
                                    <span className="text-red-500 font-bold">×</span>
                                    <span>Transaction failed</span>
                                </div>
                                <div className="ml-4 pl-3 border-l-2 border-red-500/30 text-red-300/70 text-[10px] space-y-1">
                                    {error.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!signature && !error && (
                            <div className="space-y-3">
                                <div className="text-zinc-400 flex items-center gap-2">
                                    <span className="text-zinc-500">❯</span>
                                    <span>Ready for deposit</span>
                                </div>
                                <div className="text-zinc-600 text-[10px] ml-5">
                                    Configure amount and nonce, then initiate deposit
                                </div>
                                <div className="text-zinc-700 mt-4">
                                    <span className="animate-pulse">▋</span>
                                </div>
                            </div>
                        )}

                        {signature && depositDetails && (
                            <div className="space-y-4">
                                <div className="text-zinc-300 flex items-center gap-2">
                                    <span className="text-zinc-500">❯</span>
                                    <span>bridge deposit</span>
                                    <span className="text-zinc-600">--amount</span>
                                    <span className="text-blue-400">{depositDetails.amount}</span>
                                    <span className="text-zinc-600">--nonce</span>
                                    <span className="text-purple-400">{depositDetails.nonce}</span>
                                </div>
                                
                                <div className="space-y-1.5 text-[10px] ml-5">
                                    <div className="text-zinc-500">Processing transaction...</div>
                                    <div className="text-emerald-500 flex items-center gap-2">
                                        <span>✓</span>
                                        <span>Signed by wallet</span>
                                    </div>
                                    <div className="text-emerald-500 flex items-center gap-2">
                                        <span>✓</span>
                                        <span>Submitted to network</span>
                                    </div>
                                    <div className="text-emerald-500 flex items-center gap-2">
                                        <span>✓</span>
                                        <span>Confirmed on-chain</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                        <span className="text-zinc-500">Amount</span>
                                        <span className="text-zinc-200 font-medium">{depositDetails.amount} SOL</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                        <span className="text-zinc-500">Nonce</span>
                                        <span className="text-zinc-200">{depositDetails.nonce}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                        <span className="text-zinc-500">Signature</span>
                                        <div className="text-amber-400/80 text-[10px] leading-relaxed break-all bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
                                            {signature}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <a
                                            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-[10px] group"
                                        >
                                            <span>View transaction</span>
                                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                        </a>
                                    </div>
                                </div>

                                <div className="text-zinc-700 pt-3">
                                    <span className="animate-pulse">▋</span>
                                </div>
                            </div>
                        )}

                        {!signature && !error && (
                            <div className="text-zinc-700 animate-pulse">▋</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}