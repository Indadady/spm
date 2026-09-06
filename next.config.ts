import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  ...(pages
    ? {
        basePath: "/spm",
        assetPrefix: "/spm",
      }
    : {}),
};

export default nextConfig;
