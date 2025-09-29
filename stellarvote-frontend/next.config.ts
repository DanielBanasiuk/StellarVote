import type { NextConfig } from "next";

// 自动从环境变量读取 basePath（由 GitHub Actions 推导并注入）
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // GitHub Pages 静态部署
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
