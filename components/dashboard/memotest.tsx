"use client";

import { useState } from "react";
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
import bs58 from "bs58";

const MEMO_PROGRAM_ID = address(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export function MemoTest() {
  const { wallets } = useWalletsSolana();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const wallet = wallets[0];
  const [memoText, setMemoText] = useState("Hello from Privy memo");
  const [sending, setSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [sentMemo, setSentMemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMemo = async () => {
    if (!wallet) {
      alert("No Solana wallet connected");
      return;
    }

    try {
      setSending(true);
      setSignature(null);
      setSentMemo(null);
      setError(null);

      const rpc = createSolanaRpc("http://127.0.0.1:8899");
      
      // Get latest blockhash with proper error handling
      const blockhashResponse = await rpc.getLatestBlockhash().send();
      const blockhash = blockhashResponse.value;

      // Ensure wallet address is properly formatted
      const walletAddress = address(wallet.address);

      const memoInstruction = {
        programAddress: MEMO_PROGRAM_ID,
        accounts: [],
        data: new TextEncoder().encode(memoText),
      };

      // Build transaction with proper typing
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(walletAddress, tx),
        (tx) => appendTransactionMessageInstruction(memoInstruction, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx)
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const base64Tx = getBase64EncodedWireTransaction(compiledTransaction);

      // Convert to buffer for Privy
      const transactionBuffer = Buffer.from(base64Tx, "base64");

      // Sign and send with proper configuration
      const receipt = await signAndSendTransaction({
        wallet,
        transaction: transactionBuffer,
      });

      // Handle signature properly
      const sig =
        receipt.signature instanceof Uint8Array
          ? bs58.encode(receipt.signature)
          : receipt.signature;

      setSignature(sig);
      setSentMemo(memoText);

      console.log("✅ Memo sent:", sig);
    } catch (err: unknown) {
      console.error("❌ Memo failed:", err);
      
      // Better error handling
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      
      if (errorMessage.includes("simulation failed")) {
        setError("Transaction simulation failed. Your wallet may need SOL for devnet. Try requesting from a faucet.");
      } else if (errorMessage.includes("blockhash not found")) {
        setError("Blockhash expired. Please try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* LEFT: Controls */}
      <div className="space-y-4 w-80">
        <div>
          <label className="block text-sm text-white mb-1">
            Memo text
          </label>
          <input
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter memo text"
          />
        </div>

        <button
          onClick={sendMemo}
          disabled={sending || !wallet || memoText.length === 0}
          className="w-full px-4 py-2 rounded bg-green-600 text-white disabled:opacity-40 hover:bg-green-700 transition-colors"
        >
          {sending ? "Sending…" : "Send Memo"}
        </button>

        {wallet && (
          <div className="text-xs text-zinc-400 break-all">
            <div className="font-semibold mb-1">Connected Wallet:</div>
            <div>{wallet.address}</div>
          </div>
        )}
      </div>

      {/* RIGHT: Output box */}
      <div className="flex-1">
        <div className="h-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white">
          <div className="font-semibold mb-2">Memo Output</div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-900/20 border border-red-700 text-red-400 text-sm">
              <div className="font-semibold mb-1">Error:</div>
              {error}
            </div>
          )}

          {!signature && !error && (
            <div className="text-sm text-zinc-400">
              No memo sent yet
            </div>
          )}

          {signature && (
            <div className="space-y-3 text-sm break-all">
              <div>
                <div className="text-zinc-400">Memo</div>
                <div>{sentMemo}</div>
              </div>

              <div>
                <div className="text-zinc-400">Transaction Signature</div>
                <div>{signature}</div>
              </div>

              <a
                href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-400 underline hover:text-blue-300"
              >
                View on Solana Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}