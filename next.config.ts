import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true, // ビルド時のESLintエラーを無視
  },
  typescript: {
    ignoreBuildErrors: false, // TypeScriptエラーはチェックする
  },
  // Fast Refresh強制有効化
  reactStrictMode: true,
  // Webpackキャッシュ無効化（デバッグ用）
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "w1980.blob.core.windows.net" },
      { protocol: "https", hostname: "placehold.jp" },
      { protocol: "https", hostname: "images.microcms-assets.io" },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
