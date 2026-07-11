import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "10.99.201.220"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
