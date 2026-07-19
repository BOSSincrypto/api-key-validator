import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  // Relative base: custom domain root + github.io project path both resolve assets correctly.
  base: process.env.VITE_BASE_PATH ?? "./",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: { host: "::", port: 8080 },
  build: { outDir: "dist", sourcemap: mode === "development" },
}));
