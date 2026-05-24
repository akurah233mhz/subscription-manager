import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/subscription-manager/",
  server: {
    host: "127.0.0.1",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon-96x96.png", "apple-touch-icon.png"],
      manifest: {
        name: "サブスク管理",
        short_name: "サブスク",
        description: "家族で共有するサブスクリプション管理",
        start_url: "/subscription-manager/",
        scope: "/subscription-manager/",
        display: "standalone",
        background_color: "#0f1117",
        theme_color: "#1a1d27",
        lang: "ja",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
