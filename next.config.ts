import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Handle Solana packages that have issues with SSR
      config.externals.push({
        '@solana/kit': 'commonjs @solana/kit',
        '@solana-program/memo': 'commonjs @solana-program/memo',
        '@solana-program/system': 'commonjs @solana-program/system',
        '@solana-program/token': 'commonjs @solana-program/token',
      });
    }
    return config;
  },
};

export default nextConfig;
