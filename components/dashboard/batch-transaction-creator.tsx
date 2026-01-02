"use client";

import { useState } from "react";
import { submitBatchTransactions, type BatchSubmissionResult } from "@/lib/api";
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram
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

interface BatchTransactionCreatorProps {
  onTransactionSubmitted: () => void;
  walletConnected: boolean;
  walletAddress: string;
  senderName: string;
}

export function BatchTransactionCreator({
  onTransactionSubmitted,
  walletConnected,
  walletAddress: _walletAddress,
  senderName,
}: BatchTransactionCreatorProps) {
  const [recipients, setRecipients] = useState<string[]>(["", "", ""]);
  const [amounts, setAmounts] = useState<string[]>(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<BatchSubmissionResult | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const validateInputs = () => {
    for (let i = 0; i < 3; i++) {
      if (!recipients[i].trim() || !amounts[i].trim()) {
        alert(`Please fill in recipient ${i + 1} address and amount`);
        return false;
      }

      try {
        new PublicKey(recipients[i].trim());
      } catch {
        alert(`Invalid recipient address for transaction ${i + 1}`);
        return false;
      }

      const amount = parseInt(amounts[i].trim());
      if (isNaN(amount) || amount <= 0) {
        alert(`Invalid amount for transaction ${i + 1}. Must be a positive number.`);
        return false;
      }
    }
    return true;
  };

  const handleBatchSubmit = async () => {
    if (!walletConnected) {
      alert("Please connect your Phantom wallet first");
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);
    setProgress({ completed: 0, total: 3 });

    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      
      if (!window.solana || !window.solana.publicKey) {
        throw new Error("Phantom wallet not connected");
      }

      const transactions: Transaction[] = [];
      const { blockhash } = await connection.getLatestBlockhash();

      for (let i = 0; i < 3; i++) {
        const recipientPubkey = new PublicKey(recipients[i].trim());
        const lamports = parseInt(amounts[i].trim());

        const transferInstruction = SystemProgram.transfer({
          fromPubkey: window.solana.publicKey,
          toPubkey: recipientPubkey,
          lamports: lamports,
        });

        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = window.solana.publicKey;
        transaction.add(transferInstruction);

        const signedTransaction = await window.solana.signTransaction(transaction);
        transactions.push(signedTransaction);
      }

      const result = await submitBatchTransactions(
        senderName,
        transactions,
        (completed, total) => setProgress({ completed, total })
      );

      setSubmitResult(result);
      onTransactionSubmitted();

      if (result.success) {
        setRecipients(["", "", ""]);
        setAmounts(["", "", ""]);
      }
    } catch (error) {
      console.error("Batch transaction error:", error);
      setSubmitResult({
        success: false,
        results: [{ error: error instanceof Error ? error.message : "Unknown error" }],
        settlement_triggered: false,
        total_submitted: 0
      });
    } finally {
      setIsSubmitting(false);
      setProgress({ completed: 0, total: 0 });
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return (progress.completed / progress.total) * 100;
  };

  return (
    <div className="space-y-6">
      {!walletConnected ? (
        <div className="text-center py-12 border border-white/10 rounded-2xl bg-white/5">
          <div className="text-sm font-medium uppercase tracking-wide mb-1 text-white/60">Wallet Required</div>
          <p className="text-xs text-white/40">
            Connect your wallet to use batch settlement
          </p>
        </div>
      ) : (
        <>
          {/* Settlement Notice */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm text-white rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-xs font-medium uppercase tracking-wider">Settlement Mode Active</span>
            </div>
            <p className="text-xs opacity-80">
              Submitting 3 transactions triggers L1 settlement
            </p>
          </div>

          {/* Transaction Inputs */}
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 border border-white/20 rounded-lg flex items-center justify-center text-xs font-medium text-white/80">
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-white/60">
                    Transaction {index + 1}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
                      Recipient Address
                    </label>
                    <input
                      placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
                      value={recipients[index]}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
                      Amount (lamports)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={amounts[index]}
                      onChange={(e) => updateAmount(index, e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wide text-white/80">Submitting...</span>
                <span className="text-xs font-medium text-white/60">
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-1.5 transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-white/40">
                <style jsx>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                  .spinner {
                    animation: spin 1s linear infinite;
                  }
                `}</style>
                <div className="spinner w-3 h-3 border border-white/20 border-t-emerald-400 rounded-full"></div>
                <span className="text-xs">Processing transactions...</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleBatchSubmit}
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
                <div className="spinner w-4 h-4 border-2 border-white/20 border-t-emerald-400 rounded-full"></div>
              </>
            )}
            {isSubmitting ? (
              `Submitting ${progress.completed}/3...`
            ) : (
              'Submit Batch & Trigger Settlement'
            )}
          </button>

          {/* Result */}
          {submitResult && (
            <div className={`border rounded-2xl p-4 ${
              submitResult.success 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-white/10 bg-white/5'
            }`}>
              <div className="text-sm font-medium mb-3 text-white/90">
                {submitResult.success ? '✓ Batch Submitted' : '✗ Submission Failed'}
              </div>
              
              <div className="space-y-1 text-xs text-white/60">
                <p>Transactions: {submitResult.total_submitted}/3</p>
                {submitResult.settlement_triggered && (
                  <p className="text-emerald-400 font-medium">
                    L1 Settlement triggered
                  </p>
                )}
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-white/40 hover:text-white/60">
                  View Details
                </summary>
                <pre className="text-xs mt-2 p-2 bg-black/40 border border-white/5 rounded-xl overflow-x-auto font-mono text-white/60">
                  {JSON.stringify(submitResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
}