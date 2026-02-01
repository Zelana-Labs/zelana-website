"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { L2BridgeEnhanced } from "@/components/dashboard/l2bridge-enhanced";
import { BatchTransfer } from "@/components/dashboard/batch-transfer";
import { ShieldedTransfer } from "@/components/dashboard/shielded-transfer";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { useL2Wallet } from "@/contexts/L2WalletContext";

export default function DashboardPage() {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'bridge' | 'transfer' | 'shielded' | 'history'>('bridge');

  const { user, logout, authenticated, login } = usePrivy();
  const { isReady, l2Address, error: l2Error } = useL2Wallet();

  // Login screen
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style jsx>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in-top {
          animation: slideInFromTop 0.6s ease-out forwards;
        }
        .slide-in-bottom {
          animation: slideInFromBottom 0.6s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* User Info Bar */}
        <div className="slide-in-top flex items-center justify-between mb-8 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 px-4 sm:px-6 py-4">
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

          {/* L2 Wallet Status & Actions */}
          <div className="flex items-center gap-3">
            {isReady ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">L2 Ready</span>
                </div>
                <button
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className="text-xs text-white/40 hover:text-white/60 font-mono transition-colors"
                  title={l2Address || ''}
                >
                  {l2Address ? `${l2Address.slice(0, 6)}...${l2Address.slice(-4)}` : ''}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="text-xs text-yellow-400 font-medium">Connect Wallet</span>
              </div>
            )}

            <button
              onClick={logout}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white/80 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* L2 Wallet Error */}
        {l2Error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{l2Error.message}</span>
            </div>
          </div>
        )}

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

        {/* Tab Navigation */}
        <div className="slide-in-bottom delay-100 mb-6">
          <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5 w-fit">
            <TabButton 
              active={activeTab === 'bridge'} 
              onClick={() => setActiveTab('bridge')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              }
            >
              Bridge
            </TabButton>
            <TabButton 
              active={activeTab === 'transfer'} 
              onClick={() => setActiveTab('transfer')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
            >
              Transfer
            </TabButton>
            <TabButton 
              active={activeTab === 'shielded'} 
              onClick={() => setActiveTab('shielded')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              Shielded
            </TabButton>
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              History
            </TabButton>
          </div>
        </div>

        {/* Content Area */}
        <div className="slide-in-bottom delay-200">
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-400 rounded-full" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">L2 Bridge</h3>
                <span className="text-xs text-white/40">Deposit & Withdraw</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                <L2BridgeEnhanced />
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-400 rounded-full" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Batch Transfer</h3>
                <span className="text-xs text-white/40">Send to multiple recipients</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                <BatchTransfer />
              </div>
            </div>
          )}

          {activeTab === 'shielded' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-400 rounded-full" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Shielded Transfer</h3>
                <span className="text-xs text-white/40">Privacy-preserving transactions</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                <ShieldedTransfer />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-400 rounded-full" />
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Transaction History</h3>
                <span className="text-xs text-white/40">Your L2 activity</span>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                <TransactionHistory />
              </div>
            </div>
          )}
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

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  children, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-white/10 text-white border border-white/10'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}
