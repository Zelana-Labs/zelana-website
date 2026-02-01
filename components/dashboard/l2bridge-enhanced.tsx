"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { config } from "@/lib/config";
import { useL2Wallet } from "@/contexts/L2WalletContext";
import { sequencerApi } from "@/lib/sequencer-api";

// Bridge configuration from config
const BRIDGE_PROGRAM_ID = config.bridgeProgramId;
const SYSTEM_PROGRAM_ID = address("11111111111111111111111111111111");
const DOMAIN = config.bridgeDomain;
const MIN_BALANCE_SOL = 2;

// RPC endpoints
const RPC_PRESETS = {
    devnet: "https://api.devnet.solana.com",
    localhost: "http://127.0.0.1:8899",
};

type BridgeTab = 'deposit' | 'withdraw';

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
    label?: string;
}

function WalletBalance({ walletAddress, connection, label = "L1 Balance" }: WalletBalanceProps) {
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
        // Poll every 60 seconds to avoid RPC rate limiting
        const interval = setInterval(fetchBalance, 60000);
        return () => clearInterval(interval);
    }, [walletAddress, connection]);

    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className="text-sm font-mono text-emerald-400 font-medium">
                {balance !== null ? `${balance.toFixed(4)} SOL` : "..."}
            </span>
        </div>
    );
}

// L2 Balance Component with pending balance support
function L2Balance({ fastPoll = false }: { fastPoll?: boolean }) {
    const { isReady, l2Address } = useL2Wallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [pendingBalance, setPendingBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const fetchBalance = useCallback(async () => {
        if (!isReady || !l2Address) {
            setBalance(null);
            setPendingBalance(null);
            return;
        }
        
        setIsLoading(true);
        try {
            const account = await sequencerApi.getAccount(l2Address);
            if (account) {
                setBalance(account.balance);
                setPendingBalance(account.pendingBalance ?? null);
            }
        } catch (e) {
            console.error('Failed to fetch L2 balance:', e);
        } finally {
            setIsLoading(false);
        }
    }, [isReady, l2Address]);

    useEffect(() => {
        fetchBalance();
        // Poll every 3 seconds when fastPoll is true (after transaction), otherwise 10 seconds
        const interval = setInterval(fetchBalance, fastPoll ? 3000 : 10000);
        return () => clearInterval(interval);
    }, [fetchBalance, fastPoll]);
    
    if (!isReady) {
        return (
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">L2 Balance</span>
                <span className="text-sm font-mono text-white/40">Connect wallet</span>
            </div>
        );
    }
    
    if (isLoading && balance === null) {
        return (
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">L2 Balance</span>
                <span className="text-sm font-mono text-white/40">Loading...</span>
            </div>
        );
    }
    
    const balanceInSol = balance !== null ? balance / LAMPORTS_PER_SOL : 0;
    const pendingBalanceInSol = pendingBalance !== null ? pendingBalance / LAMPORTS_PER_SOL : null;
    const hasPending = pendingBalance !== null && pendingBalance !== balance;
    
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">L2 Balance</span>
            <div className="flex items-center gap-2">
                {hasPending && pendingBalanceInSol !== null ? (
                    <>
                        <span className="text-sm font-mono text-purple-400/60 line-through">
                            {balanceInSol.toFixed(4)}
                        </span>
                        <span className="text-sm font-mono text-purple-400 font-medium">
                            {pendingBalanceInSol.toFixed(4)} zeSOL
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-medium bg-yellow-500/20 text-yellow-400 rounded">
                            PENDING
                        </span>
                    </>
                ) : (
                    <span className="text-sm font-mono text-purple-400 font-medium">
                        {balanceInSol.toFixed(4)} zeSOL
                    </span>
                )}
            </div>
        </div>
    );
}

// Tab Button Component
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                active
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
            {children}
        </button>
    );
}

// Withdrawal Status Component
function WithdrawalStatusDisplay({ txHash }: { txHash: string }) {
    const { client } = useL2Wallet();
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!client || !txHash) return;
        
        const fetchStatus = async () => {
            try {
                const withdrawal = await client.getWithdrawalStatus(txHash);
                setStatus(withdrawal.state);
            } catch (e) {
                console.error('Failed to fetch withdrawal status:', e);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [client, txHash]);
    
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-yellow-400">
                <span className="animate-spin">&#8635;</span>
                <span>Checking status...</span>
            </div>
        );
    }
    
    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
        pending: { color: 'text-yellow-400', label: 'Pending - Waiting for batch', icon: '&#9203;' },
        in_batch: { color: 'text-blue-400', label: 'In Batch - Proving in progress', icon: '&#128260;' },
        submitted: { color: 'text-purple-400', label: 'Submitted to L1', icon: '&#128228;' },
        finalized: { color: 'text-emerald-400', label: 'Finalized - Funds released!', icon: '&#10003;' },
        failed: { color: 'text-red-400', label: 'Failed', icon: '&#10007;' },
    };
    
    const config = status ? statusConfig[status] : { color: 'text-white/60', label: status || 'Unknown', icon: '?' };
    
    return (
        <div className={`flex items-center gap-2 ${config.color}`}>
            <span dangerouslySetInnerHTML={{ __html: config.icon }} />
            <span>{config.label}</span>
        </div>
    );
}

export function L2BridgeEnhanced() {
    const { wallets } = useWalletsSolana();
    const { signAndSendTransaction } = useSignAndSendTransaction();
    const wallet = wallets[0];
    
    const { isReady, client, l2Address } = useL2Wallet();

    // Tab state
    const [activeTab, setActiveTab] = useState<BridgeTab>('deposit');
    
    // Network state
    const [selectedPreset, setSelectedPreset] = useState<keyof typeof RPC_PRESETS>("devnet");
    const currentRpcUrl = RPC_PRESETS[selectedPreset];
    
    const connection = useMemo(
        () => new Connection(currentRpcUrl, "confirmed"),
        [currentRpcUrl]
    );

    // Deposit state
    const [depositAmount, setDepositAmount] = useState("1.0");
    const [depositNonce, setDepositNonce] = useState("101");
    const [depositSending, setDepositSending] = useState(false);
    const [depositSignature, setDepositSignature] = useState<string | null>(null);
    const [depositError, setDepositError] = useState<string | null>(null);

    // Withdraw state
    const [withdrawAmount, setWithdrawAmount] = useState("0.5");
    const [withdrawSending, setWithdrawSending] = useState(false);
    const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);
    const [withdrawError, setWithdrawError] = useState<string | null>(null);
    
    // Fast polling state - enabled after transactions for faster balance updates
    const [fastPoll, setFastPoll] = useState(false);
    const fastPollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Enable fast polling for 30 seconds after a transaction
    const triggerFastPoll = useCallback(() => {
        setFastPoll(true);
        if (fastPollTimeoutRef.current) {
            clearTimeout(fastPollTimeoutRef.current);
        }
        fastPollTimeoutRef.current = setTimeout(() => {
            setFastPoll(false);
        }, 30000); // 30 seconds of fast polling
    }, []);
    
    // Cleanup fast poll timeout on unmount
    useEffect(() => {
        return () => {
            if (fastPollTimeoutRef.current) {
                clearTimeout(fastPollTimeoutRef.current);
            }
        };
    }, []);
    
    // L2 balance for withdrawal validation
    const [l2Balance, setL2Balance] = useState<bigint | null>(null);
    
    // Fetch L2 balance for withdraw tab
    useEffect(() => {
        if (!client || !isReady || activeTab !== 'withdraw') return;
        
        const fetchBalance = async () => {
            try {
                const account = await client.getAccountFor(l2Address.toString());
                setL2Balance(account.balance);
            } catch (e) {
                console.error('Failed to fetch L2 balance:', e);
            }
        };
        
        fetchBalance();
    }, [client, isReady, activeTab]);

    const handleAirdrop = async () => {
        if (!wallet) return;
        setDepositSending(true);
        setDepositError(null);
        try {
            const pubkey = new PublicKey(wallet.address);
            const currentBalance = await connection.getBalance(pubkey);
            if (currentBalance < MIN_BALANCE_SOL * LAMPORTS_PER_SOL) {
                const sig = await connection.requestAirdrop(pubkey, MIN_BALANCE_SOL * LAMPORTS_PER_SOL);
                await connection.confirmTransaction(sig, "confirmed");
                alert(`Airdrop completed! Added ${MIN_BALANCE_SOL} SOL`);
            } else {
                alert(`You already have ${(currentBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setDepositError(`Airdrop failed: ${message}`);
        } finally {
            setDepositSending(false);
        }
    };

    const handleDeposit = async () => {
        if (!wallet) return;
        
        setDepositSending(true);
        setDepositSignature(null);
        setDepositError(null);

        try {
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

            const nonceNum = BigInt(depositNonce);
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

            const amountLamports = BigInt(Math.floor(parseFloat(depositAmount) * LAMPORTS_PER_SOL));
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

            const chainId = selectedPreset === 'localhost' ? 'solana:localnet' : 'solana:devnet';
            const receipt = await signAndSendTransaction({
                wallet,
                transaction: transactionBuffer,
                chain: chainId,
            });

            const sig = receipt.signature instanceof Uint8Array
                ? bs58.encode(receipt.signature)
                : receipt.signature;

            setDepositSignature(sig);
            triggerFastPoll(); // Start fast polling to show balance update quickly
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setDepositError(message);
        } finally {
            setDepositSending(false);
        }
    };

    const handleWithdraw = async () => {
        if (!client || !isReady || !wallet) return;
        
        setWithdrawSending(true);
        setWithdrawTxHash(null);
        setWithdrawError(null);

        try {
            const amountLamports = BigInt(Math.floor(parseFloat(withdrawAmount) * LAMPORTS_PER_SOL));
            
            // Validate balance
            if (l2Balance !== null && amountLamports > l2Balance) {
                throw new Error(`Insufficient L2 balance. You have ${(Number(l2Balance) / LAMPORTS_PER_SOL).toFixed(4)} zeSOL`);
            }

            // Use SDK client to withdraw (handles signing internally with correct serialization)
            const result = await client.withdraw(wallet.address, amountLamports);
            
            if (result.accepted) {
                setWithdrawTxHash(result.txHash);
                triggerFastPoll(); // Start fast polling to show balance update quickly
            } else {
                throw new Error(result.message || 'Withdrawal rejected');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setWithdrawError(message);
        } finally {
            setWithdrawSending(false);
        }
    };

    const getExplorerUrl = (sig: string) => {
        const baseUrl = "https://explorer.solana.com/tx/" + sig;
        return selectedPreset === 'localhost'
            ? `${baseUrl}?cluster=custom&customUrl=${encodeURIComponent(currentRpcUrl)}`
            : `${baseUrl}?cluster=devnet`;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-5 max-w-6xl mx-auto">
            {/* LEFT: Controls */}
            <div className="space-y-3 w-full lg:w-90">
                {/* Tab Selector */}
                <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-lg">
                    <TabButton active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
                        Deposit (L1 &rarr; L2)
                    </TabButton>
                    <TabButton active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
                        Withdraw (L2 &rarr; L1)
                    </TabButton>
                </div>

                {/* Info Card */}
                <div className="bg-linear-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
                    {/* Network Selector */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-medium">Network</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setSelectedPreset("devnet")}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                    selectedPreset === "devnet"
                                        ? "bg-blue-600 text-white"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                }`}
                            >
                                Devnet
                            </button>
                            <button
                                onClick={() => setSelectedPreset("localhost")}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                    selectedPreset === "localhost"
                                        ? "bg-blue-600 text-white"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                }`}
                            >
                                Local
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800"></div>

                    {/* Balances */}
                    {wallet && (
                        <>
                            <WalletBalance walletAddress={wallet.address} connection={connection} label="L1 Balance" />
                            <L2Balance fastPoll={fastPoll} />

                            <div className="h-px bg-zinc-800"></div>

                            {/* Addresses */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-zinc-500">L1 Address</span>
                                    {activeTab === 'deposit' && (
                                        <button
                                            onClick={handleAirdrop}
                                            disabled={depositSending}
                                            className="px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-medium disabled:opacity-40 transition-all"
                                        >
                                            Airdrop
                                        </button>
                                    )}
                                </div>
                                <div className="font-mono text-[10px] text-purple-400/90 break-all">
                                    {wallet.address}
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-zinc-500 mb-1">L2 Address</div>
                                <div className="font-mono text-[10px] text-rose-400/90 break-all">
                                    {l2Address || 'Unlock wallet to view'}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Card */}
                <div className="bg-linear-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
                    {activeTab === 'deposit' ? (
                        <>
                            <div>
                                <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Amount (SOL)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="1.0"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Deposit Nonce</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={depositNonce}
                                    onChange={(e) => setDepositNonce(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="101"
                                />
                                <p className="text-[10px] text-zinc-500 mt-1">Each deposit needs a unique nonce</p>
                            </div>

                            <button
                                onClick={handleDeposit}
                                disabled={depositSending || !wallet || !depositAmount || !depositNonce}
                                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
                            >
                                {depositSending ? "Processing..." : "Deposit to L2"}
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Amount (zeSOL)</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                                    placeholder="0.5"
                                />
                            </div>

                            <div className="text-[10px] text-zinc-500 space-y-1">
                                <p>Withdrawal destination: Your L1 wallet</p>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawSending || !withdrawAmount || !isReady}
                                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-linear-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-sm font-semibold shadow-lg shadow-yellow-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
                            >
                                {withdrawSending ? "Processing..." : "Withdraw to L1"}
                            </button>
                            
                            {/* Future work note */}
                            <div className="mt-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-[10px] text-blue-400/80">
                                        <span className="font-medium">Mode:</span> Withdrawals appear instantly. 
                                        currently, settlement takes ~20-40 secs for ZK proof generation and L1 finality.
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT: Terminal Output */}
            <div className="flex-1 min-w-0">
                <div className="h-full rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
                        <div className="hidden sm:flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors"></div>
                            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors"></div>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 ml-1">
                            bridge-terminal &mdash; {activeTab}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 font-mono text-xs overflow-auto max-h-100 lg:max-h-125 min-h-75 lg:min-h-100">
                        {activeTab === 'deposit' ? (
                            <>
                                {depositError && (
                                    <div className="space-y-2">
                                        <div className="text-red-400 flex items-center gap-2">
                                            <span className="text-red-500 font-bold">&times;</span>
                                            <span>Deposit failed</span>
                                        </div>
                                        <div className="ml-4 pl-3 border-l-2 border-red-500/30 text-red-300/70 text-[10px]">
                                            {depositError}
                                        </div>
                                    </div>
                                )}

                                {!depositSignature && !depositError && (
                                    <div className="space-y-3">
                                        <div className="text-zinc-400 flex items-center gap-2">
                                            <span className="text-zinc-500">&rsaquo;</span>
                                            <span>Ready for deposit</span>
                                        </div>
                                        <div className="text-zinc-600 text-[10px] ml-5">
                                            Configure amount and nonce, then initiate deposit
                                        </div>
                                    </div>
                                )}

                                {depositSignature && (
                                    <div className="space-y-4">
                                        <div className="text-emerald-400 flex items-center gap-2">
                                            <span>&#10003;</span>
                                            <span>Deposit confirmed!</span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                                <span className="text-zinc-500">Amount</span>
                                                <span className="text-zinc-200">{depositAmount} SOL</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                                <span className="text-zinc-500">Signature</span>
                                                <div className="text-amber-400/80 text-[10px] break-all bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
                                                    {depositSignature}
                                                </div>
                                            </div>
                                            <a
                                                href={getExplorerUrl(depositSignature)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px]"
                                            >
                                                <span>View on Solana Explorer &rarr;</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {withdrawError && (
                                    <div className="space-y-2">
                                        <div className="text-red-400 flex items-center gap-2">
                                            <span className="text-red-500 font-bold">&times;</span>
                                            <span>Withdrawal failed</span>
                                        </div>
                                        <div className="ml-4 pl-3 border-l-2 border-red-500/30 text-red-300/70 text-[10px]">
                                            {withdrawError}
                                        </div>
                                    </div>
                                )}

                                {!withdrawTxHash && !withdrawError && (
                                    <div className="space-y-3">
                                        <div className="text-zinc-400 flex items-center gap-2">
                                            <span className="text-zinc-500">&rsaquo;</span>
                                            <span>Ready for withdrawal</span>
                                        </div>
                                        <div className="text-zinc-600 text-[10px] ml-5 space-y-2">
                                            <p>Enter amount and click withdraw</p>
                                        </div>
                                    </div>
                                )}

                                {withdrawTxHash && (
                                    <div className="space-y-4">
                                        <div className="text-emerald-400 flex items-center gap-2">
                                            <span>&#10003;</span>
                                            <span>Withdrawal successful!</span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                                <span className="text-zinc-500">Amount</span>
                                                <span className="text-zinc-200">{withdrawAmount} zeSOL</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                                <span className="text-zinc-500">Tx Hash</span>
                                                <div className="text-amber-400/80 text-[10px] break-all bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
                                                    {withdrawTxHash}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
                                                <span className="text-zinc-500">Status</span>
                                                <div className="text-emerald-400 flex items-center gap-2">
                                                    <span>&#10003;</span>
                                                    <span>Complete</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-[10px] text-blue-400/80">
                                            <p className="font-medium mb-1">Production Note:</p>
                                            <p>In the production version, withdrawals go through these steps:</p>
                                            <ol className="list-decimal ml-4 mt-2 space-y-1 text-blue-400/60">
                                                <li>Transaction included in batch (~1 min)</li>
                                                <li>ZK proof generation (~5-10 min)</li>
                                                <li>L1 settlement and finality (~5 min)</li>
                                                <li>Funds released to L1 wallet</li>
                                            </ol>
                                            <p className="mt-2 text-blue-400/80">For demo purposes, withdrawals appear instantly.</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// "use client";

// import { useState, useEffect, useMemo } from "react";
// import {
//     useWallets as useWalletsSolana,
//     useSignAndSendTransaction,
// } from "@privy-io/react-auth/solana";
// import {
//     address,
//     appendTransactionMessageInstruction,
//     compileTransaction,
//     createSolanaRpc,
//     createTransactionMessage,
//     getBase64EncodedWireTransaction,
//     pipe,
//     setTransactionMessageFeePayer,
//     setTransactionMessageLifetimeUsingBlockhash,
// } from "@solana/kit";
// import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
// import bs58 from "bs58";
// import { config } from "@/lib/config";
// import { sequencerApi, type WithdrawRequest } from "@/lib/sequencer-api";
// import { useAccount, useWithdrawalStatus } from "@/hooks/useZelanaData";

// // Bridge configuration from config
// const BRIDGE_PROGRAM_ID = config.bridgeProgramId;
// const SYSTEM_PROGRAM_ID = address("11111111111111111111111111111111");
// const DOMAIN = config.bridgeDomain;
// const MIN_BALANCE_SOL = 2;

// // RPC endpoints
// const RPC_PRESETS = {
//     devnet: "https://api.devnet.solana.com",
//     localhost: "http://127.0.0.1:8899",
// };

// type BridgeTab = 'deposit' | 'withdraw';

// function mapL1ToL2(walletAddress: string): string {
//     const pubkey = new PublicKey(walletAddress);
//     const bytes = pubkey.toBytes();
//     return Array.from(bytes)
//         .map(b => b.toString(16).padStart(2, '0'))
//         .join('');
// }

// function serializeDepositParams(amount: bigint, nonce: bigint): Uint8Array {
//     const buffer = new ArrayBuffer(16);
//     const view = new DataView(buffer);
//     view.setBigUint64(0, amount, true);
//     view.setBigUint64(8, nonce, true);
//     return new Uint8Array(buffer);
// }

// // Helper to sign a message for withdrawal
// async function signWithdrawalMessage(
//     wallet: any,
//     message: Uint8Array
// ): Promise<Uint8Array> {
//     const result = await wallet.signMessage({ message });
//     if (result && typeof result === 'object' && 'signature' in result) {
//         const sig = result.signature;
//         if (sig instanceof Uint8Array) return sig;
//         if (typeof sig === 'string') return bs58.decode(sig);
//     }
//     if (result instanceof Uint8Array) return result;
//     throw new Error('Unexpected signature format');
// }

// // Serialize withdrawal data for signing
// function serializeWithdrawData(
//     from: Uint8Array,
//     toL1: Uint8Array,
//     amount: bigint,
//     nonce: bigint,
//     chainId: number
// ): Uint8Array {
//     const buffer = new ArrayBuffer(32 + 32 + 8 + 8 + 4);
//     const view = new DataView(buffer);
//     const result = new Uint8Array(buffer);
    
//     result.set(from, 0);
//     result.set(toL1, 32);
//     view.setBigUint64(64, amount, true);
//     view.setBigUint64(72, nonce, true);
//     view.setUint32(80, chainId, true);
    
//     return result;
// }

// interface WalletBalanceProps {
//     walletAddress: string;
//     connection: Connection;
//     label?: string;
// }

// function WalletBalance({ walletAddress, connection, label = "L1 Balance" }: WalletBalanceProps) {
//     const [balance, setBalance] = useState<number | null>(null);

//     useEffect(() => {
//         const fetchBalance = async () => {
//             if (!walletAddress) return;
//             try {
//                 const bal = await connection.getBalance(new PublicKey(walletAddress));
//                 setBalance(bal / LAMPORTS_PER_SOL);
//             } catch (err) {
//                 console.error("Failed to fetch balance:", err);
//                 setBalance(null);
//             }
//         };

//         fetchBalance();
//         const interval = setInterval(fetchBalance, 10000);
//         return () => clearInterval(interval);
//     }, [walletAddress, connection]);

//     return (
//         <div className="flex items-center justify-between">
//             <span className="text-xs text-zinc-400">{label}</span>
//             <span className="text-sm font-mono text-emerald-400 font-medium">
//                 {balance !== null ? `${balance.toFixed(4)} SOL` : "..."}
//             </span>
//         </div>
//     );
// }

// // L2 Balance Component
// function L2Balance({ accountId }: { accountId: string }) {
//     const { data: account, isLoading } = useAccount(accountId);
    
//     if (isLoading) {
//         return <span className="text-sm font-mono text-white/40">Loading...</span>;
//     }
    
//     const balance = account?.balance ? account.balance / LAMPORTS_PER_SOL : 0;
    
//     return (
//         <div className="flex items-center justify-between">
//             <span className="text-xs text-zinc-400">L2 Balance</span>
//             <span className="text-sm font-mono text-purple-400 font-medium">
//                 {balance.toFixed(4)} SOL
//             </span>
//         </div>
//     );
// }

// // Tab Button Component
// function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
//     return (
//         <button
//             onClick={onClick}
//             className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
//                 active
//                     ? 'bg-white/10 text-white border border-white/20'
//                     : 'text-white/60 hover:text-white hover:bg-white/5'
//             }`}
//         >
//             {children}
//         </button>
//     );
// }

// // Withdrawal Status Component
// function WithdrawalStatusDisplay({ txHash }: { txHash: string }) {
//     const { data: withdrawal, isLoading } = useWithdrawalStatus(txHash);
    
//     if (isLoading) {
//         return (
//             <div className="flex items-center gap-2 text-yellow-400">
//                 <span className="animate-spin">⟳</span>
//                 <span>Checking status...</span>
//             </div>
//         );
//     }
    
//     if (!withdrawal) {
//         return (
//             <div className="text-yellow-400">
//                 Withdrawal submitted, waiting for confirmation...
//             </div>
//         );
//     }
    
//     const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
//         pending: { color: 'text-yellow-400', label: 'Pending - Waiting for batch', icon: '⏳' },
//         in_batch: { color: 'text-blue-400', label: 'In Batch - Proving in progress', icon: '🔄' },
//         submitted: { color: 'text-purple-400', label: 'Submitted to L1', icon: '📤' },
//         finalized: { color: 'text-emerald-400', label: 'Finalized - Funds released!', icon: '✓' },
//         failed: { color: 'text-red-400', label: 'Failed', icon: '✗' },
//     };
    
//     const status = statusConfig[withdrawal.status] || { color: 'text-white/60', label: withdrawal.status, icon: '?' };
    
//     return (
//         <div className={`flex items-center gap-2 ${status.color}`}>
//             <span>{status.icon}</span>
//             <span>{status.label}</span>
//         </div>
//     );
// }

// export function L2BridgeEnhanced() {
//     const { wallets } = useWalletsSolana();
//     const { signAndSendTransaction } = useSignAndSendTransaction();
//     const wallet = wallets[0];

//     // Tab state
//     const [activeTab, setActiveTab] = useState<BridgeTab>('deposit');
    
//     // Network state
//     const [selectedPreset, setSelectedPreset] = useState<keyof typeof RPC_PRESETS>("devnet");
//     const currentRpcUrl = RPC_PRESETS[selectedPreset];
    
//     const connection = useMemo(
//         () => new Connection(currentRpcUrl, "confirmed"),
//         [currentRpcUrl]
//     );

//     // Deposit state
//     const [depositAmount, setDepositAmount] = useState("1.0");
//     const [depositNonce, setDepositNonce] = useState("101");
//     const [depositSending, setDepositSending] = useState(false);
//     const [depositSignature, setDepositSignature] = useState<string | null>(null);
//     const [depositError, setDepositError] = useState<string | null>(null);

//     // Withdraw state
//     const [withdrawAmount, setWithdrawAmount] = useState("0.5");
//     const [withdrawSending, setWithdrawSending] = useState(false);
//     const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null);
//     const [withdrawError, setWithdrawError] = useState<string | null>(null);

//     const l2AccountId = wallet ? mapL1ToL2(wallet.address) : null;

//     const handleAirdrop = async () => {
//         if (!wallet) return;
//         setDepositSending(true);
//         setDepositError(null);
//         try {
//             const pubkey = new PublicKey(wallet.address);
//             const currentBalance = await connection.getBalance(pubkey);
//             if (currentBalance < MIN_BALANCE_SOL * LAMPORTS_PER_SOL) {
//                 const sig = await connection.requestAirdrop(pubkey, MIN_BALANCE_SOL * LAMPORTS_PER_SOL);
//                 await connection.confirmTransaction(sig, "confirmed");
//                 alert(`Airdrop completed! Added ${MIN_BALANCE_SOL} SOL`);
//             } else {
//                 alert(`You already have ${(currentBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
//             }
//         } catch (err: any) {
//             setDepositError(`Airdrop failed: ${err.message}`);
//         } finally {
//             setDepositSending(false);
//         }
//     };

//     const handleDeposit = async () => {
//         if (!wallet) return;
        
//         setDepositSending(true);
//         setDepositSignature(null);
//         setDepositError(null);

//         try {
//             const rpc = createSolanaRpc(currentRpcUrl);
//             const blockhashResponse = await rpc.getLatestBlockhash().send();
//             const blockhash = blockhashResponse.value;

//             const walletAddress = address(wallet.address);
//             const walletPubkey = new PublicKey(wallet.address);

//             const domainPadded = new Uint8Array(32);
//             const domainBytes = new TextEncoder().encode(DOMAIN);
//             domainPadded.set(domainBytes);

//             const programId = new PublicKey(BRIDGE_PROGRAM_ID);

//             const [configPda] = PublicKey.findProgramAddressSync(
//                 [Buffer.from("config"), Buffer.from(domainPadded)],
//                 programId
//             );

//             const [vaultPda] = PublicKey.findProgramAddressSync(
//                 [Buffer.from("vault"), Buffer.from(domainPadded)],
//                 programId
//             );

//             const nonceNum = BigInt(depositNonce);
//             const nonceBytes = new Uint8Array(8);
//             new DataView(nonceBytes.buffer).setBigUint64(0, nonceNum, true);

//             const [receiptPda] = PublicKey.findProgramAddressSync(
//                 [
//                     Buffer.from("receipt"),
//                     Buffer.from(domainPadded),
//                     walletPubkey.toBuffer(),
//                     Buffer.from(nonceBytes),
//                 ],
//                 programId
//             );

//             const amountLamports = BigInt(Math.floor(parseFloat(depositAmount) * LAMPORTS_PER_SOL));
//             const params = serializeDepositParams(amountLamports, nonceNum);
//             const instructionData = new Uint8Array([1, ...params]);

//             const depositInstruction = {
//                 programAddress: address(BRIDGE_PROGRAM_ID),
//                 accounts: [
//                     { address: walletAddress, role: 3 },
//                     { address: address(configPda.toBase58()), role: 0 },
//                     { address: address(vaultPda.toBase58()), role: 1 },
//                     { address: address(receiptPda.toBase58()), role: 1 },
//                     { address: SYSTEM_PROGRAM_ID, role: 0 },
//                 ],
//                 data: instructionData,
//             };

//             const transactionMessage = pipe(
//                 createTransactionMessage({ version: 0 }),
//                 (tx) => setTransactionMessageFeePayer(walletAddress, tx),
//                 (tx) => appendTransactionMessageInstruction(depositInstruction, tx),
//                 (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx)
//             );

//             const compiledTransaction = compileTransaction(transactionMessage);
//             const base64Tx = getBase64EncodedWireTransaction(compiledTransaction);
//             const transactionBuffer = Buffer.from(base64Tx, "base64");

//             const chainId = selectedPreset === 'localhost' ? 'solana:localnet' : 'solana:devnet';
//             const receipt = await signAndSendTransaction({
//                 wallet,
//                 transaction: transactionBuffer,
//                 chain: chainId,
//             });

//             const sig = receipt.signature instanceof Uint8Array
//                 ? bs58.encode(receipt.signature)
//                 : receipt.signature;

//             setDepositSignature(sig);
//         } catch (err: any) {
//             setDepositError(err.message);
//         } finally {
//             setDepositSending(false);
//         }
//     };

//     const handleWithdraw = async () => {
//         if (!wallet || !l2AccountId) return;
        
//         setWithdrawSending(true);
//         setWithdrawTxHash(null);
//         setWithdrawError(null);

//         try {
//             // Get current account to get nonce
//             const account = await sequencerApi.getAccount(l2AccountId);
//             if (!account) {
//                 throw new Error("L2 account not found. Please deposit first.");
//             }

//             const amountLamports = BigInt(Math.floor(parseFloat(withdrawAmount) * LAMPORTS_PER_SOL));
//             if (amountLamports > BigInt(account.balance)) {
//                 throw new Error(`Insufficient L2 balance. You have ${(account.balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
//             }

//             // Prepare withdrawal data
//             const fromBytes = new Uint8Array(32);
//             const l2Bytes = Buffer.from(l2AccountId, 'hex');
//             fromBytes.set(l2Bytes);

//             const toL1Bytes = new PublicKey(wallet.address).toBytes();
//             const nonce = BigInt(account.nonce);
//             const chainId = 1; // Devnet chain ID

//             // Serialize and sign
//             const withdrawData = serializeWithdrawData(fromBytes, toL1Bytes, amountLamports, nonce, chainId);
//             const signature = await signWithdrawalMessage(wallet, withdrawData);

//             // Submit withdrawal request
//             const request: WithdrawRequest = {
//                 from: l2AccountId,
//                 to_l1_address: Array.from(toL1Bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
//                 amount: Number(amountLamports),
//                 nonce: Number(nonce),
//                 signature: Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(''),
//                 signer_pubkey: wallet.address,
//             };

//             const response = await sequencerApi.submitWithdrawal(request);
//             setWithdrawTxHash(response.tx_hash);
//         } catch (err: any) {
//             setWithdrawError(err.message);
//         } finally {
//             setWithdrawSending(false);
//         }
//     };

//     const getExplorerUrl = (sig: string) => {
//         const baseUrl = "https://explorer.solana.com/tx/" + sig;
//         return selectedPreset === 'localhost'
//             ? `${baseUrl}?cluster=custom&customUrl=${encodeURIComponent(currentRpcUrl)}`
//             : `${baseUrl}?cluster=devnet`;
//     };

//     return (
//         <div className="flex gap-5 max-w-6xl mx-auto">
//             {/* LEFT: Controls */}
//             <div className="space-y-3 w-[360px]">
//                 {/* Tab Selector */}
//                 <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-lg">
//                     <TabButton active={activeTab === 'deposit'} onClick={() => setActiveTab('deposit')}>
//                         Deposit (L1 → L2)
//                     </TabButton>
//                     <TabButton active={activeTab === 'withdraw'} onClick={() => setActiveTab('withdraw')}>
//                         Withdraw (L2 → L1)
//                     </TabButton>
//                 </div>

//                 {/* Info Card */}
//                 <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
//                     {/* Network Selector */}
//                     <div className="flex items-center justify-between">
//                         <span className="text-xs text-zinc-400 font-medium">Network</span>
//                         <div className="flex gap-1">
//                             <button
//                                 onClick={() => setSelectedPreset("devnet")}
//                                 className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
//                                     selectedPreset === "devnet"
//                                         ? "bg-blue-600 text-white"
//                                         : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
//                                 }`}
//                             >
//                                 Devnet
//                             </button>
//                             <button
//                                 onClick={() => setSelectedPreset("localhost")}
//                                 className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
//                                     selectedPreset === "localhost"
//                                         ? "bg-blue-600 text-white"
//                                         : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
//                                 }`}
//                             >
//                                 Local
//                             </button>
//                         </div>
//                     </div>

//                     <div className="h-px bg-zinc-800"></div>

//                     {/* Balances */}
//                     {wallet && (
//                         <>
//                             <WalletBalance walletAddress={wallet.address} connection={connection} label="L1 Balance" />
//                             {l2AccountId && <L2Balance accountId={l2AccountId} />}

//                             <div className="h-px bg-zinc-800"></div>

//                             {/* Addresses */}
//                             <div>
//                                 <div className="flex items-center justify-between mb-1">
//                                     <span className="text-[10px] text-zinc-500">L1 Address</span>
//                                     {activeTab === 'deposit' && (
//                                         <button
//                                             onClick={handleAirdrop}
//                                             disabled={depositSending}
//                                             className="px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-medium disabled:opacity-40 transition-all"
//                                         >
//                                             Airdrop
//                                         </button>
//                                     )}
//                                 </div>
//                                 <div className="font-mono text-[10px] text-purple-400/90 break-all">
//                                     {wallet.address}
//                                 </div>
//                             </div>

//                             <div>
//                                 <div className="text-[10px] text-zinc-500 mb-1">L2 Address</div>
//                                 <div className="font-mono text-[10px] text-rose-400/90 break-all">
//                                     {l2AccountId}
//                                 </div>
//                             </div>
//                         </>
//                     )}
//                 </div>

//                 {/* Action Card */}
//                 <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-zinc-700/50 rounded-lg p-3 space-y-2.5">
//                     {activeTab === 'deposit' ? (
//                         <>
//                             <div>
//                                 <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Amount (SOL)</label>
//                                 <input
//                                     type="number"
//                                     step="0.001"
//                                     min="0"
//                                     value={depositAmount}
//                                     onChange={(e) => setDepositAmount(e.target.value)}
//                                     className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
//                                     placeholder="1.0"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Deposit Nonce</label>
//                                 <input
//                                     type="number"
//                                     min="0"
//                                     value={depositNonce}
//                                     onChange={(e) => setDepositNonce(e.target.value)}
//                                     className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
//                                     placeholder="101"
//                                 />
//                                 <p className="text-[10px] text-zinc-500 mt-1">Each deposit needs a unique nonce</p>
//                             </div>

//                             <button
//                                 onClick={handleDeposit}
//                                 disabled={depositSending || !wallet || !depositAmount || !depositNonce}
//                                 className="w-full mt-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
//                             >
//                                 {depositSending ? "Processing..." : "Deposit to L2"}
//                             </button>
//                         </>
//                     ) : (
//                         <>
//                             <div>
//                                 <label className="block text-[11px] text-zinc-400 font-medium mb-1.5">Amount (SOL)</label>
//                                 <input
//                                     type="number"
//                                     step="0.001"
//                                     min="0"
//                                     value={withdrawAmount}
//                                     onChange={(e) => setWithdrawAmount(e.target.value)}
//                                     className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white text-sm border border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
//                                     placeholder="0.5"
//                                 />
//                             </div>

//                             <div className="text-[10px] text-zinc-500 space-y-1">
//                                 <p>Withdrawal destination: Your L1 wallet</p>
//                                 <p className="text-yellow-400/80">Note: Withdrawals are processed after batch settlement</p>
//                             </div>

//                             <button
//                                 onClick={handleWithdraw}
//                                 disabled={withdrawSending || !wallet || !withdrawAmount}
//                                 className="w-full mt-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-sm font-semibold shadow-lg shadow-yellow-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
//                             >
//                                 {withdrawSending ? "Processing..." : "Withdraw to L1"}
//                             </button>
//                         </>
//                     )}
//                 </div>
//             </div>

//             {/* RIGHT: Terminal Output */}
//             <div className="flex-1">
//                 <div className="h-full rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
//                     <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
//                         <div className="flex gap-2">
//                             <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors"></div>
//                             <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors"></div>
//                             <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors"></div>
//                         </div>
//                         <div className="text-xs font-mono text-zinc-400 ml-1">
//                             bridge-terminal — {activeTab}
//                         </div>
//                     </div>

//                     <div className="p-6 font-mono text-xs overflow-auto max-h-[500px] min-h-[400px]">
//                         {activeTab === 'deposit' ? (
//                             <>
//                                 {depositError && (
//                                     <div className="space-y-2">
//                                         <div className="text-red-400 flex items-center gap-2">
//                                             <span className="text-red-500 font-bold">×</span>
//                                             <span>Deposit failed</span>
//                                         </div>
//                                         <div className="ml-4 pl-3 border-l-2 border-red-500/30 text-red-300/70 text-[10px]">
//                                             {depositError}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {!depositSignature && !depositError && (
//                                     <div className="space-y-3">
//                                         <div className="text-zinc-400 flex items-center gap-2">
//                                             <span className="text-zinc-500">❯</span>
//                                             <span>Ready for deposit</span>
//                                         </div>
//                                         <div className="text-zinc-600 text-[10px] ml-5">
//                                             Configure amount and nonce, then initiate deposit
//                                         </div>
//                                     </div>
//                                 )}

//                                 {depositSignature && (
//                                     <div className="space-y-4">
//                                         <div className="text-emerald-400 flex items-center gap-2">
//                                             <span>✓</span>
//                                             <span>Deposit confirmed!</span>
//                                         </div>
//                                         <div className="mt-4 space-y-3">
//                                             <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
//                                                 <span className="text-zinc-500">Amount</span>
//                                                 <span className="text-zinc-200">{depositAmount} SOL</span>
//                                             </div>
//                                             <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
//                                                 <span className="text-zinc-500">Signature</span>
//                                                 <div className="text-amber-400/80 text-[10px] break-all bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
//                                                     {depositSignature}
//                                                 </div>
//                                             </div>
//                                             <a
//                                                 href={getExplorerUrl(depositSignature)}
//                                                 target="_blank"
//                                                 rel="noopener noreferrer"
//                                                 className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px]"
//                                             >
//                                                 <span>View on Solana Explorer →</span>
//                                             </a>
//                                         </div>
//                                     </div>
//                                 )}
//                             </>
//                         ) : (
//                             <>
//                                 {withdrawError && (
//                                     <div className="space-y-2">
//                                         <div className="text-red-400 flex items-center gap-2">
//                                             <span className="text-red-500 font-bold">×</span>
//                                             <span>Withdrawal failed</span>
//                                         </div>
//                                         <div className="ml-4 pl-3 border-l-2 border-red-500/30 text-red-300/70 text-[10px]">
//                                             {withdrawError}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {!withdrawTxHash && !withdrawError && (
//                                     <div className="space-y-3">
//                                         <div className="text-zinc-400 flex items-center gap-2">
//                                             <span className="text-zinc-500">❯</span>
//                                             <span>Ready for withdrawal</span>
//                                         </div>
//                                         <div className="text-zinc-600 text-[10px] ml-5 space-y-2">
//                                             <p>Enter amount and click withdraw</p>
//                                             <p className="text-yellow-400/60">Withdrawals are processed when the batch is settled on L1</p>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {withdrawTxHash && (
//                                     <div className="space-y-4">
//                                         <div className="text-yellow-400 flex items-center gap-2">
//                                             <span>⏳</span>
//                                             <span>Withdrawal submitted!</span>
//                                         </div>
//                                         <div className="mt-4 space-y-3">
//                                             <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
//                                                 <span className="text-zinc-500">Amount</span>
//                                                 <span className="text-zinc-200">{withdrawAmount} SOL</span>
//                                             </div>
//                                             <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
//                                                 <span className="text-zinc-500">Tx Hash</span>
//                                                 <div className="text-amber-400/80 text-[10px] break-all bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
//                                                     {withdrawTxHash}
//                                                 </div>
//                                             </div>
//                                             <div className="grid grid-cols-[100px_1fr] gap-2 text-xs">
//                                                 <span className="text-zinc-500">Status</span>
//                                                 <WithdrawalStatusDisplay txHash={withdrawTxHash} />
//                                             </div>
//                                         </div>
//                                         <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 text-[10px] text-zinc-500">
//                                             <p>Your withdrawal will be processed automatically when:</p>
//                                             <ol className="list-decimal ml-4 mt-2 space-y-1">
//                                                 <li>The transaction is included in a batch</li>
//                                                 <li>The batch is proven (ZK proof generated)</li>
//                                                 <li>The batch is settled on Solana L1</li>
//                                                 <li>Funds are released to your L1 wallet</li>
//                                             </ol>
//                                         </div>
//                                     </div>
//                                 )}
//                             </>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }