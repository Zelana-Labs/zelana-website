"use client";

import { useState, useEffect, useMemo } from "react";
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

// Bridge configuration
const BRIDGE_PROGRAM_ID = "9HXapBN9otLGnQNGv1HRk91DGqMNvMAvQqohL7gPW1sd";
const SYSTEM_PROGRAM_ID = address("11111111111111111111111111111111");
const DOMAIN = "solana";
const MIN_BALANCE_SOL = 2;

// Preset RPC endpoints
const RPC_PRESETS = {
    devnet: "https://api.devnet.solana.com",
    localhost: "http://127.0.0.1:8899",
    mainnet: "https://api.mainnet-beta.solana.com",
};

function mapL1ToL2(walletAddress: string): string {
    const pubkey = new PublicKey(walletAddress);
    const bytes = pubkey.toBytes();
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function serializeDepositParams(amount: bigint, nonce: bigint): Uint8Array {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setBigUint64(0, amount, true);
    view.setBigUint64(8, nonce, true);
    return new Uint8Array(buffer);
}

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
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [walletAddress, connection]);

    return (
        <span className="text-sm font-mono text-emerald-400 font-medium">
            {balance !== null ? `${balance.toFixed(4)} SOL` : "..."}
        </span>
    );
}

export function L2Bridge() {
    const { wallets } = useWalletsSolana();
    const { signAndSendTransaction } = useSignAndSendTransaction();

    const wallet = wallets[0];

    const [selectedPreset, setSelectedPreset] = useState<keyof typeof RPC_PRESETS>("devnet");
    const [customRpcUrl, setCustomRpcUrl] = useState("");
    const [isCustomRpc, setIsCustomRpc] = useState(false);
    const [amount, setAmount] = useState("1.0");
    const [nonce, setNonce] = useState("101");
    const [sending, setSending] = useState(false);
    const [signature, setSignature] = useState<string | null>(null);
    const [depositDetails, setDepositDetails] = useState<{
        amount: string;
        nonce: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const currentRpcUrl = isCustomRpc ? customRpcUrl : RPC_PRESETS[selectedPreset];

    const connection = useMemo(
        () => new Connection(currentRpcUrl, "confirmed"),
        [currentRpcUrl]
    );

    const getCluster = () => {
        if (currentRpcUrl.includes("127.0.0.1") || currentRpcUrl.includes("localhost")) {
            return "localhost";
        } else if (currentRpcUrl.includes("devnet")) {
            return "devnet";
        } else if (currentRpcUrl.includes("mainnet")) {
            return "mainnet-beta";
        }
        return "custom";
    };

    const cluster = getCluster();

    const getChainId = (): string => {
        if (currentRpcUrl.includes("127.0.0.1") || currentRpcUrl.includes("localhost")) {
            return "solana:localnet";
        } else if (currentRpcUrl.includes("devnet")) {
            return "solana:devnet";
        } else if (currentRpcUrl.includes("mainnet")) {
            return "solana:mainnet";
        }
        return "solana:devnet";
    };

    const handlePresetChange = (preset: keyof typeof RPC_PRESETS) => {
        if (preset === "mainnet") return;
        setSelectedPreset(preset);
        setIsCustomRpc(false);
    };

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

            const rpc = createSolanaRpc(currentRpcUrl);
            const blockhashResponse = await rpc.getLatestBlockhash().send();
            const blockhash = blockhashResponse.value;

            const walletAddress = address(wallet.address);
            const walletPubkey = new PublicKey(wallet.address);

            const domainPadded = new Uint8Array(32);
            const domainBytes = new TextEncoder().encode(DOMAIN);
            domainPadded.set(domainBytes);

            const programId = new PublicKey(BRIDGE_PROGRAM_ID);

            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config"), Buffer.from(domainPadded)],
                programId
            );

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), Buffer.from(domainPadded)],
                programId
            );

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

            const amountLamports = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
            const params = serializeDepositParams(amountLamports, nonceNum);
            const instructionData = new Uint8Array([1, ...params]);

            const depositInstruction = {
                programAddress: address(BRIDGE_PROGRAM_ID),
                accounts: [
                    { address: walletAddress, role: 3 },
                    { address: address(configPda.toBase58()), role: 0 },
                    { address: address(vaultPda.toBase58()), role: 1 },
                    { address: address(receiptPda.toBase58()), role: 1 },
                    { address: SYSTEM_PROGRAM_ID, role: 0 },
                ],
                data: instructionData,
            };

            const transactionMessage = pipe(
                createTransactionMessage({ version: 0 }),
                (tx) => setTransactionMessageFeePayer(walletAddress, tx),
                (tx) => appendTransactionMessageInstruction(depositInstruction, tx),
                (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx)
            );

            const compiledTransaction = compileTransaction(transactionMessage);
            const base64Tx = getBase64EncodedWireTransaction(compiledTransaction);
            const transactionBuffer = Buffer.from(base64Tx, "base64");

            const chainId = getChainId();

            const receipt = await signAndSendTransaction({
                wallet,
                transaction: transactionBuffer,
                chain: chainId,
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
                    "• Wrong cluster"
                );
            } else if (errorMessage.includes("blockhash not found")) {
                setError("Blockhash expired. Please try again.");
            } else if (errorMessage.includes("insufficient funds")) {
                setError("Insufficient funds. You need SOL to cover the deposit amount plus transaction fees.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setSending(false);
        }
    };

    const getExplorerUrl = (sig: string) => {
        const baseUrl = "https://explorer.solana.com/tx/" + sig;

        if (cluster === "localhost") {
            return `${baseUrl}?cluster=custom&customUrl=${encodeURIComponent(currentRpcUrl)}`;
        } else if (cluster === "devnet") {
            return `${baseUrl}?cluster=devnet`;
        } else if (cluster === "mainnet-beta") {
            return baseUrl;
        } else {
            return `${baseUrl}?cluster=custom&customUrl=${encodeURIComponent(currentRpcUrl)}`;
        }
    };

    return (
        <div className="flex gap-5 max-w-6xl mx-auto px-4">
            {/* LEFT: Controls */}
            <div className="space-y-2 w-[340px]">
                {/* Info Card - Network, Wallet, Config */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
                    {/* Network Selector */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Network</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => handlePresetChange("devnet")}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${selectedPreset === "devnet" && !isCustomRpc
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer"
                                    }`}
                            >
                                Devnet
                            </button>
                            <button
                                onClick={() => handlePresetChange("localhost")}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${selectedPreset === "localhost" && !isCustomRpc
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer"
                                    }`}
                            >
                                Local
                            </button>
                            <button
                                title="soon"
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/50 text-zinc-600 cursor-pointer"
                            >
                                Mainnet
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800"></div>

                    {/* Wallet Info */}
                    {wallet && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-400">Balance</span>
                                <WalletBalance walletAddress={wallet.address} connection={connection} />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-zinc-500">L1 Address</span>
                                    <button
                                        onClick={handleAirdrop}
                                        disabled={sending || !wallet}
                                        className="px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-medium disabled:opacity-40 transition-all disabled:cursor-not-allowed"
                                    >
                                        Airdrop
                                    </button>
                                </div>
                                <div className="font-mono text-[10px] text-purple-400/90 break-all leading-relaxed">
                                    {wallet.address}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-zinc-500 mb-1">L2 Address</div>
                                <div className="font-mono text-[10px] text-rose-400/90 break-all leading-relaxed">
                                    {mapL1ToL2(wallet.address)}
                                </div>
                            </div>

                            <div className="h-px bg-zinc-800"></div>

                            {/* Config */}
                            <div className="text-[10px] space-y-0.5">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Program id</span>
                                    <span className="text-[9px] text-zinc-400 font-mono">{BRIDGE_PROGRAM_ID}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Domain</span>
                                    <span className="text-zinc-400 font-mono">{DOMAIN}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Card - Inputs & Deposit Button */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
                    <div>
                        <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Amount (SOL)</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="1.0"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Nonce</label>
                        <input
                            type="number"
                            min="0"
                            value={nonce}
                            onChange={(e) => setNonce(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            placeholder="101"
                        />
                    </div>

                    <button
                        onClick={deposit}
                        disabled={sending || !wallet || !amount || !nonce}
                        className="w-full mt-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
                    >
                        {sending ? "Processing Transaction..." : "Deposit to Bridge"}
                    </button>
                </div>
            </div>

            {/* RIGHT: Terminal Output */}
            <div className="flex-1">
                <div className="h-full rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors"></div>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 ml-1">
                            bridge-terminal
                        </div>
                    </div>

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
                                            href={getExplorerUrl(signature)}
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
                    </div>
                </div>
            </div>
        </div>
    );
}