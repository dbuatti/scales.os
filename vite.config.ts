import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";

function readProjectEnv() {
  const filePath = "/vercel/share/.env.project";

  try {
    const contents = fs.readFileSync(filePath, "utf8");
    return Object.fromEntries(
      contents
        .split(/\r?\n/)
        .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map(([, key, value]) => [key, value.replace(/^['\"]|['\"]$/g, "")]),
    );
  } catch {
    return {};
  }
}

export default defineConfig(() => {
  const projectEnv = readProjectEnv();

  return {
    server: {
      host: "::",
      port: 8080,
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL ?? projectEnv.VITE_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY ?? projectEnv.VITE_SUPABASE_ANON_KEY,
      ),
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
