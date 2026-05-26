import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Vite config with proxy for local dev to Express server
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    outDir: "dist",
  },
});

