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
        includeAssets: ["favicon.ico"],
        manifest: {
          name: "Scales — Piano Technique Practice",
          short_name: "Scales",
          description: "Track Hanon, Dohnányi, scales and arpeggios with a metronome and PDF technical exercises.",
          start_url: "/",
          display: "standalone",
          background_color: "#0f0f0f",
          theme_color: "#0f0f0f",
          orientation: "portrait-primary",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "64x64 32x32 24x24 16x16",
              type: "image/x-icon",
            },
          ],
          categories: ["education", "music", "productivity"],
          shortcuts: [
            {
              name: "Practice Reader",
              short_name: "Reader",
              description: "Open the PDF practice reader",
              url: "/reader",
              icons: [{ src: "/favicon.ico", sizes: "96x96" }],
            },
            {
              name: "Practice Command Center",
              short_name: "Practice",
              description: "Open the main practice dashboard",
              url: "/practice",
              icons: [{ src: "/favicon.ico", sizes: "96x96" }],
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,wasm}"],
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
