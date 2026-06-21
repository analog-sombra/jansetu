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
};

export default nextConfig;
