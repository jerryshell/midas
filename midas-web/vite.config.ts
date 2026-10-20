import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

const backend = process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 9000,
    proxy: {
      "/indexCode": backend,
      "/indexData": backend,
      "/simulate": backend,
      "/health": backend,
    },
  },
  build: {
    target: "esnext",
  },
});
