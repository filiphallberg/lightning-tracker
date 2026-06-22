import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  server: {
    host: "127.0.0.1",
    // When running the UI dev server alone, proxy API calls to a locally
    // running `wrangler pages dev` instance (see `pnpm dev:api`).
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
