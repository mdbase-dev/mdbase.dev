import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The SDK needs no bundler configuration: Vite serves its worker and
// WebAssembly files in development and emits them as assets in a build.
export default defineConfig({
  plugins: [react()],
  // The development manifest names this exact origin.
  server: { port: 5173, strictPort: true },
});
