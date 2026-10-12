import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "");
  const env = {
    ...loadedEnv,
    VITE_SUPABASE_URL: loadedEnv.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY:
      loadedEnv.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  };

  return {
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
