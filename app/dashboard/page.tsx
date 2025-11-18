"use client";

import { useEffect, useState } from "react";
import { TransactionCreator } from "@/components/transaction-creator";
import { BatchTransactionCreator } from "@/components/batch-transaction-creator";
import {
  healthCheck,
  getTransactionsPage,
  type TransactionWithHash,
} from "@/lib/api";
import { usePrivy } from "@privy-io/react-auth";
import { json } from "stream/consumers";

interface HealthStatus {
  status: string;
  timestamp: number;
}

export default function RollupClientPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithHash[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [senderName, setSenderName] = useState("");
  const { user, logout, authenticated, login } = usePrivy();

  const handleWalletConnect = (connected: boolean, address: string, name: string) => {
    setWalletConnected(connected);
    setWalletAddress(address);
    setSenderName(name);
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to zkSVM
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access your dashboard
            </p>
            <button
              onClick={login}
              className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // useEffect(() => {
  //   const sol = (window)?.solana;
  //   if (sol?.isConnected && sol.publicKey) {
  //     setWalletConnected(true);
  //     setWalletAddress(sol.publicKey.toString());
  //     setSenderName("Phantom User");
  //   }
  // }, []);


  const performHealthCheck = async () => {
    setIsHealthLoading(true);
    try {
      const result = await healthCheck();
      setHealthStatus({ status: JSON.stringify(result), timestamp: Date.now() });
    } catch (error) {
      setHealthStatus({
        status: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsHealthLoading(false);
    }
  };

  const loadTransactions = async (page = 1) => {
    setIsTransactionsLoading(true);
    try {
      const result = await getTransactionsPage(page, 10);
      setTransactions(result.transactions);
      setCurrentPage(page);
    } catch (e) {
      console.error("Failed to load transactions:", e);
    } finally {
      setIsTransactionsLoading(false);
    }
  };


  // useEffect(() => {
  //   performHealthCheck();
  //   loadTransactions();
  // }, []);

  // primitives
  const Card = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <section className={`rounded-2xl border bg-white/80 dark:bg-slate-900/70 ring-1 ring-black/5 dark:ring-white/10 shadow-md ${className}`}>
      {children}
    </section>
  );

  const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );

  const Button = ({
    children,
    onClick,
    disabled,
    variant = "solid",
    size = "md",
    className = "",
    type = "button",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "solid" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    type?: "button" | "submit" | "reset";
  }) => {
    const sizeCls = size === "lg" ? "h-12 px-6" : size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4";
    const base = "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-4 ring-indigo-500/20";
    const variants =
      variant === "outline"
        ? "border border-slate-300/70 dark:border-slate-700/70 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
        : variant === "ghost"
          ? "hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
          : "bg-indigo-600 text-white hover:bg-indigo-600/90";
    return (
      <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizeCls} ${variants} disabled:opacity-60 ${className}`}>
        {children}
      </button>
    );
  };

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-slate-300/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/60 px-3 text-sm outline-none focus:ring-4 ring-indigo-500/20 ${props.className ?? ""}`}
    />
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(60rem_60rem_at_90%_-10%,rgba(99,102,241,.2),transparent),radial-gradient(50rem_50rem_at_-10%_10%,rgba(16,185,129,.15),transparent)]">
      {/* Sticky top actions */}
      <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-b border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={performHealthCheck} disabled={isHealthLoading} size="sm">
              {isHealthLoading ? "Checking…" : "Health Check"}
            </Button>
            <Button onClick={logout}>
              Logout
            </Button>
            <p>{user?.wallet?.address ?? "No wallet connected"}</p>
                       {user && (
                        <div className="bg-gray-50 rounded-md p-4 overflow-auto">
                            <pre className="text-sm text-gray-800">
                                {JSON.stringify(user, null, 2)}
                            </pre>
                        </div>
                    )}
          </div>
        </div>
      </div>

      {/* Page container */}
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Network Status</div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${healthStatus?.status.includes("Error") ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                  />
                  <span className="text-xl font-semibold">
                    {healthStatus?.status.includes("Error") ? "Offline" : "Online"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-indigo-100 text-indigo-700 p-2 dark:bg-indigo-900/30 dark:text-indigo-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Total Transactions</div>
                <div className="mt-2 text-xl font-semibold">{transactions.length}</div>
              </div>
              <div className="rounded-xl bg-indigo-100 text-indigo-700 p-2 dark:bg-indigo-900/30 dark:text-indigo-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.707 5.707" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">Current Page</div>
                <div className="mt-2 text-xl font-semibold">{currentPage}</div>
              </div>
              <div className="rounded-xl bg-indigo-100 text-indigo-700 p-2 dark:bg-indigo-900/30 dark:text-indigo-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2h10v2m-12 2h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Create Transactions */}
        <section className="space-y-8">
          <SectionTitle
            title="Create Transactions"
            subtitle="Build single or batched transactions. Submitting 3 in batch will trigger immediate L1 settlement."
          />

          {/* Batch creator full width */}
          <Card>
            <div className="p-6">
              <BatchTransactionCreator
                onTransactionSubmitted={() => loadTransactions(currentPage)}
                walletConnected={walletConnected}
                walletAddress={walletAddress}
                senderName={senderName}
              />
            </div>
          </Card>

          {/* Two-column: Health + Single creator */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">System Health</h3>
                  <Button onClick={performHealthCheck} disabled={isHealthLoading}>
                    {isHealthLoading ? "Checking…" : "Run Health Check"}
                  </Button>
                </div>

                {healthStatus && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 p-4">
                    <code className="block text-xs font-mono break-all">{healthStatus.status}</code>
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last checked: {new Date(healthStatus.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <TransactionCreator
                  onTransactionSubmitted={() => loadTransactions(currentPage)}
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  senderName={senderName}
                  onWalletConnect={handleWalletConnect}
                />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
