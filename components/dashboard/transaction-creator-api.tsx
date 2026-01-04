"use client";

import { useState } from "react";
import { useWallets as useWalletsSolana } from "@privy-io/react-auth/solana";
import { submitZelanaTransaction, type ZelanaTransactionParams } from "@/lib/api";
import { PublicKey } from "@solana/web3.js";

export function TransactionCreator() {
    const { wallets } = useWalletsSolana();
    const wallet = wallets[0]; // Get first Solana wallet

    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [nonce, setNonce] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<Record<string, unknown> | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Helper: Map L1 address to L2 hex format
    const mapL1ToL2 = (walletAddress: string): string => {
        const pubkey = new PublicKey(walletAddress);
        const bytes = pubkey.toBytes();
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    };

    // ----- L2 TRANSACTION SUBMISSION -----
    const handleSubmit = async () => {
        if (!wallet) {
            alert("Please connect your wallet first!");
            return;
        }

        if (!recipientAddress.trim() || !amount.trim()) {
            alert("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            // Validate and clean recipient address
            const cleanAddress = recipientAddress.trim().replace(/^0x/, "");

            if (!/^[0-9a-fA-F]{64}$/.test(cleanAddress)) {
                throw new Error("Recipient address must be exactly 64 hexadecimal characters");
            }

            const amountValue = Number.parseInt(amount.trim(), 10);
            const nonceValue = Number.parseInt(nonce.trim(), 10);

            if (isNaN(amountValue) || amountValue <= 0) {
                throw new Error("Amount must be a positive number");
            }

            if (isNaN(nonceValue) || nonceValue < 0) {
                throw new Error("Nonce must be a non-negative number");
            }

            const publicKey = new PublicKey(wallet.address);

            const params: ZelanaTransactionParams = {
                senderPublicKey: publicKey,
                recipientAddress: cleanAddress,
                amount: amountValue,
                nonce: nonceValue,
                chainId: 1,
                privyWallet: wallet
            };

            console.log("\n🚀 Submitting transaction:", params);

            const result = await submitZelanaTransaction(params);

            if (result.success) {
                setSubmitResult({
                    status: "success",
                    message: result.message || "Transaction accepted",
                    txHash: result.txHash,
                    timestamp: new Date().toISOString(),
                });

                // Auto-increment nonce for next transaction
                setNonce(String(nonceValue + 1));
                setAmount("");

                console.log("✅ Transaction successful!");
            } else {
                setSubmitResult({
                    status: "error",
                    error: result.error,
                    timestamp: new Date().toISOString(),
                });
                console.error("❌ Transaction failed:", result.error);
            }
        } catch (error) {
            console.error("Transaction error:", error);
            setSubmitResult({
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ----- VALIDATION HELPERS -----
    const isValidRecipient =
        recipientAddress.trim().length === 0 ||
        /^(0x)?[0-9a-fA-F]{64}$/.test(recipientAddress.trim());

    const recipientError =
        recipientAddress.trim() && !isValidRecipient ? "Must be 64 hex characters" : null;

    return (
        <div className="space-y-6">
            {/* Wallet Status */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Wallet Status
                    </span>
                    {wallet && (
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                            {showDebug ? "Hide" : "Show"} Debug
                        </button>
                    )}
                </div>

                {wallet ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">Connected via Privy</span>
                            <span className="text-xs font-mono text-white/80">
                                {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                            </span>
                        </div>

                        {showDebug && (
                            <div className="text-xs font-mono text-white/40 border-t border-white/10 pt-2 mt-2 space-y-1">
                                <div className="break-all">
                                    <span className="text-white/30">L1 Address:</span>
                                    <div className="text-purple-400/80 ml-2">{wallet.address}</div>
                                </div>
                                <div className="break-all">
                                    <span className="text-white/30">L2 Address:</span>
                                    <div className="text-rose-400/80 ml-2">{mapL1ToL2(wallet.address)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-3">
                        <p className="text-sm text-white/60 mb-2">No Solana wallet connected</p>
                        <p className="text-xs text-white/40">
                            Please connect using Privy in the navigation
                        </p>
                    </div>
                )}
            </div>

            {/* Transaction Form */}
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
                        Recipient L2 Address
                    </label>
                    <input
                        placeholder="64 hex characters (without 0x)"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className={`w-full bg-black/40 border ${recipientError ? "border-red-500/50" : "border-white/10"
                            } rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors`}
                        disabled={!wallet}
                    />
                    {recipientError && <p className="mt-1 text-xs text-red-400">{recipientError}</p>}
                    <p className="mt-1 text-xs text-white/30">
                        Example: a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
                    </p>
                </div>

                <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
                        Amount
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={1}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        disabled={!wallet}
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
                        Nonce
                    </label>
                    <input
                        type="number"
                        placeholder="1"
                        value={nonce}
                        onChange={(e) => setNonce(e.target.value)}
                        min={0}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        disabled={!wallet}
                    />
                    <p className="mt-1 text-xs text-white/30">Auto-increments after successful transaction</p>
                </div>
            </div>

            {/* Submit Button */}
            {wallet && (
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isValidRecipient || !amount}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl py-3 text-sm font-medium uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        "Submit L2 Transaction"
                    )}
                </button>
            )}

            {/* Result Display */}
            {submitResult && (
                <div
                    className={`border ${submitResult.status === "success"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                        } backdrop-blur-sm rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="text-sm font-medium uppercase tracking-wide text-white/90">
                            {submitResult.status === "success" ? "✓ Success" : "✗ Error"}
                        </div>
                        <button
                            onClick={() => setSubmitResult(null)}
                            className="text-white/40 hover:text-white/60 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-2">


                        <pre className="text-xs font-mono text-white/60 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                            {JSON.stringify(submitResult, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Help Text */}
            {!wallet && (
                <div className="text-xs text-white/40 text-center space-y-1">
                    <p>Connect your Privy wallet to submit L2 transactions</p>
                    <p>Make sure the sequencer is running on localhost:8080</p>
                </div>
            )}
        </div>
    );
}