import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // eslintの設定は削除する（Vercelの設定画面で無視設定を入れるため、ここでは書かない）
  
  // Server Actionsのボディサイズ制限を設定（デフォルトは1MB）
  // Vercelの制限（4.5MB）を考慮して5MBに設定
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
