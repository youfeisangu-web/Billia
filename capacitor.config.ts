import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.billia.app",
  appName: "Billia",
  webDir: "out",
  server: {
    // 本番デプロイ後にVercelのURLに変更してください
    // url: "https://your-app.vercel.app",
    cleartext: false,
  },
};

export default config;
