"use client";

import { useEffect, useState } from "react";
import { TransactionCreator } from "@/components/dashboard/transaction-creator";
import { BatchTransactionCreator } from "@/components/dashboard/batch-transaction-creator";
import {
  healthCheck,
  getTransactionsPage,
  type TransactionWithHash,
} from "@/lib/api";
import { usePrivy } from "@privy-io/react-auth";

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
  const [showUserInfo, setShowUserInfo] = useState(false);

  const { user, logout, authenticated, login } = usePrivy();

  useEffect(() => {
    if (authenticated) {
      performHealthCheck();
      loadTransactions();
    }
  }, [authenticated]);

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

  // Login screen - white background like main site
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .delay-1 { animation-delay: 0.1s; opacity: 0; }
        `}</style>

        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center fade-in">

            <h1 className="text-xl font-light text-black tracking-tight">
              Zelana Dashboard
            </h1>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4 fade-in delay-1">
            <button
              onClick={login}
              className="w-full bg-black hover:bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-medium tracking-wide transition-all"
            >
              Sign In
            </button>
            <p className="text-center text-xs text-gray-400 font-light">
              Privacy-focused zkSVM on Solana
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = healthStatus && !healthStatus.status.includes("Error");

  // Loading state
  if (!healthStatus && isHealthLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes fadeInScale {
            from { 
              opacity: 0; 
              transform: scale(0.9);
            }
            to { 
              opacity: 1; 
              transform: scale(1);
            }
          }
          .spinner {
            animation: spin 1s linear infinite;
          }
          .pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          .fade-in-scale {
            animation: fadeInScale 0.8s ease-out forwards;
          }
        `}</style>
        
        <div className="text-center space-y-6 fade-in-scale">
          <div className="relative inline-flex items-center justify-center">
            {/* Spinning ring */}
            <div className="spinner w-16 h-16 border-2 border-white/10 border-t-emerald-400 rounded-full"></div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/60 font-semibold text-xl">Z</span>
            </div>
          </div>
          <div className="pulse text-sm text-white/40 uppercase tracking-widest">
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .slide-in-top {
          animation: slideInFromTop 0.6s ease-out forwards;
        }
        .slide-in-bottom {
          animation: slideInFromBottom 0.6s ease-out forwards;
        }
        .fade-in-scale {
          animation: fadeInScale 0.6s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
        .delay-400 { animation-delay: 0.4s; opacity: 0; }
        .delay-500 { animation-delay: 0.5s; opacity: 0; }
      `}</style>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        
        {/* User Info Bar */}
        <div className="slide-in-top flex items-center justify-between mb-8 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.email?.address?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <button
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {user?.wallet?.address 
                ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                : user?.email?.address || "Account"}
            </button>
          </div>
          
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white/80 transition-all"
          >
            Logout
          </button>
        </div>

        {/* User Info Dropdown */}
        {showUserInfo && user && (
          <div className="mb-8 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40">User Details</span>
              <button 
                onClick={() => setShowUserInfo(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <pre className="text-xs text-white/60 overflow-auto max-h-48 font-mono bg-black/40 border border-white/5 rounded-xl p-4">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Stats - Gamified Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {/* Network Status */}
          <div className="fade-in-scale delay-100 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:border-white/20 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Network</span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/20"}`} />
            </div>
            <div className="text-lg font-semibold text-white">
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>

          {/* Transactions */}
          <div className="fade-in-scale delay-200 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:border-white/20 transition-all">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Transactions</div>
            <div className="text-lg font-semibold text-white">
              {isTransactionsLoading ? "—" : transactions.length}
            </div>
          </div>

          {/* Page */}
          <div className="fade-in-scale delay-300 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 hover:border-white/20 transition-all">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-3">Page</div>
            <div className="text-lg font-semibold text-white">
              {currentPage}
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-8">
          {/* Section Header */}
          <div className="slide-in-bottom delay-400 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Create Transactions</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Creator */}
            <div className="slide-in-bottom delay-500 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/60 rounded-full" />
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Batch Transaction</h3>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all">
                <BatchTransactionCreator
                  onTransactionSubmitted={() => loadTransactions(currentPage)}
                  walletConnected={!!user?.wallet?.address}
                  walletAddress={user?.wallet?.address || ""}
                  senderName={user?.email?.address || user?.wallet?.address || "User"}
                />
              </div>
            </div>

            {/* Single Transaction */}
            <div className="slide-in-bottom delay-500 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/60 rounded-full" />
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Single Transaction</h3>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all">
                <TransactionCreator
                  onTransactionSubmitted={() => loadTransactions(currentPage)}
                  walletConnected={!!user?.wallet?.address}
                  walletAddress={user?.wallet?.address || ""}
                  senderName={user?.email?.address || user?.wallet?.address || "User"}
                  onWalletConnect={() => {}}
                />
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/60 rounded-full" />
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">System Health</h3>
              </div>
              <button
                onClick={performHealthCheck}
                disabled={isHealthLoading}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white/80 transition-all disabled:opacity-30"
              >
                {isHealthLoading ? "Checking..." : "Run Check"}
              </button>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
              {healthStatus ? (
                <div className="space-y-4">
                  <code className="block text-sm font-mono text-white/60 break-all leading-relaxed">
                    {healthStatus.status}
                  </code>
                  <div className="text-xs font-medium uppercase tracking-wide text-white/30 pt-4 border-t border-white/5">
                    {new Date(healthStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-sm text-white/30 uppercase tracking-wide">
                    No health check performed
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-xs text-white/30 text-center uppercase tracking-widest">
            Privacy-focused zkSVM on Solana
          </div>
        </div>
      </footer>
    </div>
  );
}