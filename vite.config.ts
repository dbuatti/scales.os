import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
      ),
    },
    plugins: [
      dyadComponentTagger(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "icon.svg",
          "icon-192.png",
          "icon-512.png",
          "icon-maskable-512.png",
          "apple-touch-icon.png",
        ],
        manifest: {
          name: "Scales.os — Piano Technique Practice",
          short_name: "Scales",
          description:
            "Structured scales and arpeggios, a metronome that follows your tempo, and your method books — with every session logged.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#F7F4EE",
          theme_color: "#4A1620",
          orientation: "any",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          categories: ["education", "music", "productivity"],
          shortcuts: [
            {
              name: "Practice Reader",
              short_name: "Reader",
              description: "Open the PDF practice reader",
              url: "/reader",
              icons: [{ src: "/icon-192.png", sizes: "192x192" }],
            },
            {
              name: "Practice",
              short_name: "Practice",
              description: "Open the practice workspace",
              url: "/",
              icons: [{ src: "/icon-192.png", sizes: "192x192" }],
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,mjs,css,html,ico,png,svg,woff2,wasm}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                networkTimeoutSeconds: 10,
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "pdf-storage",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
