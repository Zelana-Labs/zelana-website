/**
 * Explorer UI utility components
 * 
 * Reusable components for the block explorer.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { getExplorerUrl } from '@/lib/config';

// Stat Card

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'yellow' | 'cyan';
  href?: string;
}

export function StatCard({ label, value, icon, color = 'green', href }: StatCardProps) {
  const colorClasses = {
    green: 'text-emerald-400 border-emerald-400/20',
    blue: 'text-blue-400 border-blue-400/20',
    purple: 'text-purple-400 border-purple-400/20',
    yellow: 'text-yellow-400 border-yellow-400/20',
    cyan: 'text-cyan-400 border-cyan-400/20',
  };

  const content = (
    <div className={`bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        {icon && <span className={colorClasses[color]}>{icon}</span>}
      </div>
      <div className={`text-2xl font-semibold ${colorClasses[color].split(' ')[0]}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Hash Display

interface HashDisplayProps {
  hash: string;
  truncate?: boolean;
  copyable?: boolean;
  link?: 'tx' | 'address' | 'batch' | 'account';
  className?: string;
}

export function HashDisplay({ hash, truncate = true, copyable = true, link, className = '' }: HashDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
  };
  if (!hash) {
    return (
      <span className={`font-mono text-sm text-white/40 ${className}`}>
        —
      </span>
    );
  }
  const content = (
    <span className={`font-mono text-sm ${className}`}>
      <span className="text-emerald-400">{hash.slice(0, 8)}</span>
      {truncate && hash.length > 16 && <span className="text-white/40">...</span>}
      <span className="text-cyan-400">{truncate && hash.length > 16 ? hash.slice(-8) : hash.slice(8)}</span>
    </span>
  );

  if (link === 'tx' || link === 'address') {
    return (
      <a
        href={getExplorerUrl(link, hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
        title={hash}
      >
        {content}
      </a>
    );
  }

  if (link === 'account') {
    return (
      <Link href={`/explorer/accounts?id=${hash}`} className="hover:underline" title={hash}>
        {content}
      </Link>
    );
  }

  if (link === 'batch') {
    return (
      <Link href={`/explorer/batches?id=${hash}`} className="hover:underline" title={hash}>
        {content}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-2" title={hash}>
      {content}
      {copyable && (
        <button
          onClick={handleCopy}
          className="text-white/40 hover:text-white/60 transition-colors"
          title="Copy to clipboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Status Badge

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    // Transaction status
    pending: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Pending' },
    included: { color: 'bg-blue-400/20 text-blue-400', label: 'Included' },
    executed: { color: 'bg-purple-400/20 text-purple-400', label: 'Executed' },
    settled: { color: 'bg-emerald-400/20 text-emerald-400', label: 'Settled' },
    failed: { color: 'bg-red-400/20 text-red-400', label: 'Failed' },
    
    // Batch status
    building: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Building' },
    proving: { color: 'bg-purple-400/20 text-purple-400', label: 'Proving' },
    pending_settlement: { color: 'bg-blue-400/20 text-blue-400', label: 'Settling' },
    
    // Withdrawal status
    in_batch: { color: 'bg-blue-400/20 text-blue-400', label: 'In Batch' },
    submitted: { color: 'bg-purple-400/20 text-purple-400', label: 'Submitted' },
    finalized: { color: 'bg-emerald-400/20 text-emerald-400', label: 'Finalized' },
    
    // Connection status
    connected: { color: 'bg-emerald-400/20 text-emerald-400', label: 'Connected' },
    disconnected: { color: 'bg-red-400/20 text-red-400', label: 'Disconnected' },
    connecting: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Connecting' },
    
    // Health status
    healthy: { color: 'bg-emerald-400/20 text-emerald-400', label: 'Healthy' },
    degraded: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Degraded' },
    unhealthy: { color: 'bg-red-400/20 text-red-400', label: 'Unhealthy' },
  };
  const normalizedType = status?.toLowerCase();
  const config = statusConfig[normalizedType] || { color: 'bg-white/20 text-white/60', label: status };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}

// Transaction Type Badge

interface TxTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export function TxTypeBadge({ type, size = 'sm' }: TxTypeBadgeProps) {
  const typeConfig: Record<string, { color: string; label: string }> = {
    deposit: { color: 'bg-emerald-400/20 text-emerald-400', label: 'Deposit' },
    transfer: { color: 'bg-blue-400/20 text-blue-400', label: 'Transfer' },
    withdrawal: { color: 'bg-yellow-400/20 text-yellow-400', label: 'Withdraw' },
    shielded: { color: 'bg-purple-400/20 text-purple-400', label: 'Shielded' },
  };
  const normalizedType = type?.toLowerCase();
  const config =
  (normalizedType && typeConfig[normalizedType]) ||
  { color: 'bg-white/20 text-white/60', label: type ?? 'Unknown' };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}

// Connection Status Indicator

interface ConnectionIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting';
  label?: string;
}

export function ConnectionIndicator({ status, label }: ConnectionIndicatorProps) {
  const statusColors = {
    connected: 'bg-emerald-400',
    disconnected: 'bg-red-400',
    connecting: 'bg-yellow-400 animate-pulse',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      {label && <span className="text-xs text-white/60">{label}</span>}
    </div>
  );
}

// Loading Skeleton

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
  );
}

// Empty State

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-white/20">{icon}</div>}
      <h3 className="text-lg font-medium text-white/60">{title}</h3>
      {description && <p className="mt-1 text-sm text-white/40">{description}</p>}
    </div>
  );
}

// Pagination

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="text-sm text-white/60">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// Time Display

interface TimeDisplayProps {
  timestamp: number; // Unix timestamp in seconds or milliseconds
  relative?: boolean;
}

export function TimeDisplay({ timestamp, relative = true }: TimeDisplayProps) {
  if (timestamp == null) {
    return (
      <span className="text-white/40">
        —
      </span>
    );
  }

  const ts =
    typeof timestamp === 'bigint'
      ? Number(timestamp)
      : typeof timestamp === 'string'
      ? Number(timestamp)
      : timestamp;

  if (!Number.isFinite(ts)) {
    return (
      <span className="text-white/40">
        Invalid time
      </span>
    );
  }

  // Convert to milliseconds if in seconds
  const ms = ts > 1e12 ? ts : ts * 1000;
  const date = new Date(ms);

  if (isNaN(date.getTime())) {
    return (
      <span className="text-white/40">
        Invalid time
      </span>
    );
  }

  if (relative) {
    const diff = Date.now() - ms;

    if (diff < 60000) return <span className="text-white/60">Just now</span>;
    if (diff < 3600000) return <span className="text-white/60">{Math.floor(diff / 60000)}m ago</span>;
    if (diff < 86400000) return <span className="text-white/60">{Math.floor(diff / 3600000)}h ago</span>;
    if (diff < 604800000) return <span className="text-white/60">{Math.floor(diff / 86400000)}d ago</span>;
  }

  return (
    <span className="text-white/60" title={date.toISOString()}>
      {date.toLocaleDateString()} {date.toLocaleTimeString()}
    </span>
  );
}


// Amount Display

interface AmountDisplayProps {
  amount: number; // in lamports
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({ amount, showSign = false, className = '' }: AmountDisplayProps) {
  const sol = amount / 1e9;
  const sign = showSign && amount > 0 ? '+' : '';
  const color = showSign ? (amount > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white';

  return (
    <span className={`font-mono ${color} ${className}`}>
      {sign}{sol.toFixed(4)} SOL
    </span>
  );
}
