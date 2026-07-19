import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  // For GitHub Pages project sites the app is served from /<repo>/.
  // Set VITE_BASE_PATH="/<repo>/" in the deploy workflow. Defaults to "/" for local dev / custom domains.
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: { host: "::", port: 8080 },
  build: { outDir: "dist", sourcemap: mode === "development" },
}));
