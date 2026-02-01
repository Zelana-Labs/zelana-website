/**
 * Zelana Website Configuration
 * 
 * Centralized configuration for all environment variables.
 * All values have sensible defaults for local development.
 */

export type Network = 'devnet' | 'testnet' | 'mainnet';

export interface ZelanaConfig {
  // Network
  network: Network;
  
  // Solana RPC
  solanaRpc: string;
  
  // Zelana Core Sequencer
  sequencerUrl: string;
  sequencerWsUrl: string;
  
  // Prover Coordinator (Forge Network)
  proverUrl: string;
  
  // Program IDs
  bridgeProgramId: string;
  sunspotProgramId: string;
  
  // Bridge Domain
  bridgeDomain: string;
  
  // Feature Flags
  features: {
    withdrawals: boolean;
    shielded: boolean;
    fastWithdrawals: boolean;
  };
}

/**
 * Get the current configuration based on environment variables.
 * Defaults are set for local development on devnet.
 */
export function getConfig(): ZelanaConfig {
  const network = (process.env.NEXT_PUBLIC_NETWORK || 'devnet') as Network;
  
  return {
    network,
    
    // Solana RPC - defaults based on network
    solanaRpc: process.env.NEXT_PUBLIC_SOLANA_RPC || getSolanaRpcForNetwork(network),
    
    // Sequencer URLs (support both SEQUENCER_URL and ROLLUP_URL for backwards compatibility)
    sequencerUrl: process.env.NEXT_PUBLIC_SEQUENCER_URL || process.env.NEXT_PUBLIC_ROLLUP_URL || 'http://localhost:3001',
    sequencerWsUrl: process.env.NEXT_PUBLIC_SEQUENCER_WS_URL || 'ws://localhost:3001/ws',
    
    // Prover URL
    proverUrl: process.env.NEXT_PUBLIC_PROVER_URL || 'http://localhost:8080',
    
    // Program IDs
    bridgeProgramId: process.env.NEXT_PUBLIC_BRIDGE_PROGRAM_ID || '8SE6gCijcFQixvDQqWu29mCm9AydN8hcwWh2e2Q6RQgE',
    sunspotProgramId: process.env.NEXT_PUBLIC_SUNSPOT_PROGRAM_ID || 'EZzyLrTrC4uyU488jVAs4GKeCR1s9GmoFggeiDqwDeNK',
    
    // Bridge Domain
    bridgeDomain: process.env.NEXT_PUBLIC_BRIDGE_DOMAIN || 'zelana',
    
    // Feature Flags
    features: {
      withdrawals: process.env.NEXT_PUBLIC_ENABLE_WITHDRAWALS !== 'false',
      shielded: process.env.NEXT_PUBLIC_ENABLE_SHIELDED !== 'false',
      fastWithdrawals: process.env.NEXT_PUBLIC_ENABLE_FAST_WITHDRAWALS === 'true',
    },
  };
}

/**
 * Get the default Solana RPC URL for a given network.
 */
function getSolanaRpcForNetwork(network: Network): string {
  switch (network) {
    case 'devnet':
      return 'https://api.devnet.solana.com';
    case 'testnet':
      return 'https://api.testnet.solana.com';
    case 'mainnet':
      return 'https://api.mainnet-beta.solana.com';
    default:
      return 'https://api.devnet.solana.com';
  }
}

/**
 * Get the Solana Explorer URL for a transaction or address.
 */
export function getExplorerUrl(type: 'tx' | 'address' | 'block', id: string, network?: Network): string {
  const net = network || getConfig().network;
  const cluster = net === 'mainnet' ? '' : `?cluster=${net}`;
  
  switch (type) {
    case 'tx':
      return `https://explorer.solana.com/tx/${id}${cluster}`;
    case 'address':
      return `https://explorer.solana.com/address/${id}${cluster}`;
    case 'block':
      return `https://explorer.solana.com/block/${id}${cluster}`;
    default:
      return `https://explorer.solana.com/${cluster}`;
  }
}

// Export singleton config for easy access
export const config = getConfig();
