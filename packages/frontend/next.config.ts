import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@openclaw/core', '@openclaw/shared'],
};

export default nextConfig;
