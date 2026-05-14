import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone/PC access on local network during dev
  allowedDevOrigins: ["192.168.1.46", "127.0.0.1"],
};

export default nextConfig;
