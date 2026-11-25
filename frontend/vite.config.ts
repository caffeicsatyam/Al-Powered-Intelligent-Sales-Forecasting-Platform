import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function cleanStaticAssetsPlugin(): Plugin {
  return {
    name: "clean-static-assets",
    buildStart() {
      const staticDir = resolve(__dirname, "../static");
      const assetsDir = resolve(staticDir, "assets");
      const indexHtml = resolve(staticDir, "index.html");
      if (existsSync(assetsDir)) {
        rmSync(assetsDir, { recursive: true, force: true });
      }
      if (existsSync(indexHtml)) {
        rmSync(indexHtml, { force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), cleanStaticAssetsPlugin()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/static": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../static",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: false,
  },
});
