import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure server-side packages are bundled correctly
  serverExternalPackages: ["cheerio"],
};

export default nextConfig;
