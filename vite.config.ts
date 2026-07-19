import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  // Custom domain (api-key-validator.bossincrypto.dev) uses "/".
  // Override with VITE_BASE_PATH="/api-key-validator/" for project Pages without CNAME.
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: { host: "::", port: 8080 },
  build: { outDir: "dist", sourcemap: mode === "development" },
}));
