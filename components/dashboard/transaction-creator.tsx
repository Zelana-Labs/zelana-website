// "use client";

// import { useState } from "react";
// import { submitZelanaTransaction, type ZelanaTransactionParams } from "@/lib/api";
// import { PublicKey } from "@solana/web3.js";

// interface TransactionCreatorProps {
//   walletConnected: boolean;
//   walletAddress: string;
//   senderName: string;
//   onWalletConnect: (connected: boolean, address: string, name: string) => void;
// }

// export function TransactionCreator({
//   walletConnected,
//   walletAddress,
//   senderName,
//   onWalletConnect,
// }: TransactionCreatorProps) {
//   const [recipientAddress, setRecipientAddress] = useState("");
//   const [amount, setAmount] = useState("");
//   const [nonce, setNonce] = useState("1");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitResult, setSubmitResult] = useState<Record<string, unknown> | null>(null);

//   // ----- L2 TRANSACTION -----
//   const handleSubmit = async () => {
//     if (!walletConnected) return alert("Connect your wallet first!");
//     if (!recipientAddress.trim() || !amount.trim()) return alert("Fill all fields");

//     setIsSubmitting(true);
//     setSubmitResult(null);

//     try {
//       const cleanAddress = recipientAddress.trim().replace(/^0x/, '');
//       if (!/^[0-9a-fA-F]{64}$/.test(cleanAddress)) {
//         throw new Error("Recipient must be 64 hex chars");
//       }

//       const amountValue = Number.parseInt(amount.trim(), 10);
//       const nonceValue = Number.parseInt(nonce.trim(), 10);
//       const publicKey = new PublicKey(walletAddress);

//       const params: ZelanaTransactionParams = {
//         senderPublicKey: publicKey,
//         recipientAddress: cleanAddress,
//         amount: amountValue,
//         nonce: nonceValue,
//         chainId: 1,
//       };

//       const result = await submitZelanaTransaction(params);

//       if (result.success) {
//         setSubmitResult({
//           status: "success",
//           message: result.message || "Transaction accepted",
//           txHash: result.txHash,
//         });
//         setNonce(String(nonceValue + 1));
//         setAmount("");
//       } else {
//         setSubmitResult({
//           status: "error",
//           error: result.error,
//         });
//       }

//     } catch (error) {
//       console.error("Transaction error:", error);
//       setSubmitResult({
//         status: "error",
//         error: error instanceof Error ? error.message : "Unknown error",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
//           Recipient L2 Address
//         </label>
//         <input
//           placeholder="64 hex chars"
//           value={recipientAddress}
//           onChange={(e) => setRecipientAddress(e.target.value)}
//           className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
//           disabled={!walletConnected}
//         />
//       </div>

//       <div>
//         <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
//           Amount
//         </label>
//         <input
//           type="number"
//           placeholder="e.g. 1"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           min={1}
//           className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
//           disabled={!walletConnected}
//         />
//       </div>

//       <div>
//         <label className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 block">
//           Nonce
//         </label>
//         <input
//           type="number"
//           placeholder="1"
//           value={nonce}
//           onChange={(e) => setNonce(e.target.value)}
//           min={0}
//           className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
//           disabled={!walletConnected}
//         />
//       </div>

//       {walletConnected && (
//         <div className="space-y-2">
//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl py-3 text-sm font-medium uppercase tracking-wide disabled:opacity-30"
//           >
//             {isSubmitting ? "Submitting..." : "Submit L2 Transaction"}
//           </button>
//         </div>
//       )}

//       {submitResult && (
//         <div className={`border ${
//           submitResult.status === 'success' 
//             ? 'border-emerald-500/20 bg-emerald-500/5' 
//             : 'border-red-500/20 bg-red-500/5'
//         } backdrop-blur-sm rounded-2xl p-4`}>
//           <div className="text-sm font-medium uppercase tracking-wide mb-3 text-white/90">
//             {submitResult.status === 'success' ? '✓ Success' : '✗ Error'}
//           </div>
//           <pre className="text-xs font-mono text-white/60 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
//             {JSON.stringify(submitResult, null, 2)}
//           </pre>
//         </div>
//       )}
//     </div>
//   );
// }