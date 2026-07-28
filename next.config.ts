import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Next 16 blocks cross-origin dev assets/HMR by default.
  // Allow common private-network host patterns used by LAN/VM/dev tunnels.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],

  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },

  // Webpack configuration to handle Node.js packages like mariadb that use 'fs'
  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      // For client-side builds, exclude node_modules from bundling
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      };

      // Mark server-only packages as external to prevent bundling in client
      config.externals = {
        ...config.externals,
        mariadb: 'mariadb',
        '@prisma/adapter-mariadb': '@prisma/adapter-mariadb',
      };
    }

    return config;
  },

  // Turbopack configuration - explicitly empty to use webpack instead
  turbopack: {},
};

export default nextConfig;
