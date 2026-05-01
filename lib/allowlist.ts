export interface Allowlist {
  allowedWallets: string[];
}

export async function fetchAllowlist(): Promise<Allowlist> {
  try {
    const res = await fetch('/allowlist.json', { cache: 'no-store' });
    if (!res.ok) {
      return { allowedWallets: [] };
    }
    return res.json();
  } catch {
    return { allowedWallets: [] };
  }
}

export function isWalletAllowed(walletAddress: string, allowlist: Allowlist): boolean {
  if (!walletAddress || allowlist.allowedWallets.length === 0) return false;
  return allowlist.allowedWallets.some(
    (addr) => addr.toLowerCase() === walletAddress.toLowerCase()
  );
}