"use client";

import { useState } from "react";
import { submitTransaction } from "@/lib/api";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Commitment,
} from "@solana/web3.js";

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      publicKey?: PublicKey;
      isConnected?: boolean;
    };
  }
}

interface TransactionCreatorProps {
  onTransactionSubmitted: () => void;
  walletConnected: boolean;
  walletAddress: string;
  senderName: string;
  onWalletConnect: (connected: boolean, address: string, name: string) => void;
}

export function TransactionCreator({
  onTransactionSubmitted,
  walletConnected,
  walletAddress,
  senderName,
  onWalletConnect,
}: TransactionCreatorProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<Record<string, unknown> | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert("Please install Phantom wallet");
        return;
      }
      const resp = await window.solana.connect();
      onWalletConnect(true, resp.publicKey.toString(), "Phantom User");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect to Phantom wallet");
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      onWalletConnect(false, "", "");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const handleSubmit = async () => {
    if (!walletConnected) {
      alert("Please connect your Phantom wallet first");
      return;
    }

    if (!senderName.trim() || !recipientAddress.trim() || !amount.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const commitment: Commitment = "confirmed";
      const connection = new Connection("https://api.devnet.solana.com", commitment);

      if (!window.solana?.publicKey) {
        throw new Error("Phantom wallet not connected");
      }

      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipientAddress.trim());
      } catch {
        throw new Error("Invalid recipient address (must be a valid Solana public key)");
      }

      const lamports = Number.parseInt(amount.trim(), 10);
      if (!Number.isFinite(lamports) || lamports <= 0) {
        throw new Error("Amount must be a positive integer (lamports)");
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

      const ix = SystemProgram.transfer({
        fromPubkey: window.solana.publicKey,
        toPubkey: recipientPubkey,
        lamports,
      });

      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = window.solana.publicKey;
      tx.add(ix);

      const signedTx = await window.solana.signTransaction(tx);

      const result = await submitTransaction(senderName, signedTx);

      setSubmitResult({
        ...result,
        lastValidBlockHeight,
      });
      onTransactionSubmitted();

      setRecipientAddress("");
      setAmount("");
    } catch (error) {
      console.error("Transaction error:", error);
      setSubmitResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!walletConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Connect your Phantom wallet to create transactions
          </p>
          <button
            onClick={connectWallet}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl py-3 text-sm font-medium uppercase tracking-wide transition-all"
          >
            Connect Phantom Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm text-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Wallet Connected</span>
              <button
                onClick={disconnectWallet}
                className="text-xs font-medium uppercase tracking-wide hover:opacity-70 transition-opacity"
              >
                Disconnect
              </button>
            </div>
            <p className="text-xs font-mono break-all opacity-80">{walletAddress}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
              Sender Name
            </label>
            <input
              value={senderName}
              readOnly
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60 cursor-not-allowed"
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
          Recipient Address
        </label>
        <input
          placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
        />
        <p className="text-xs text-white/30 mt-1.5">
          Must be a valid base58 Solana public key
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
          Amount (lamports)
        </label>
        <input
          type="number"
          placeholder="e.g. 1000000 (= 0.001 SOL)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
        />
        <p className="text-xs text-white/30 mt-1.5">
          1 SOL = 1,000,000,000 lamports
        </p>
      </div>

      {walletConnected && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl py-3 text-sm font-medium uppercase tracking-wide transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                .spinner {
                  animation: spin 1s linear infinite;
                }
              `}</style>
              <div className="spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
            </>
          )}
          {isSubmitting ? "Submitting..." : "Submit Transaction"}
        </button>
      )}

      {submitResult && (
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-sm font-medium uppercase tracking-wide mb-3 text-white/90">
            Result
          </div>
          <pre className="text-xs font-mono text-white/60 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {JSON.stringify(submitResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}