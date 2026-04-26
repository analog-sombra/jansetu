import type { NextConfig } from "next";

const extraAllowedDevOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  devIndicators: false,
  // Next.js 16 blocks cross-origin dev assets/HMR by default.
  // Allow local network hosts so the app works from another device on LAN.
  allowedDevOrigins: ["192.168.1.20", ...extraAllowedDevOrigins],
};

export default nextConfig;
